import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLeadsStore } from "@/stores/leadsStore";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useToast } from "@/components/ui/use-toast";
import {
  getAssignedUserId,
  filterLeadsByUser,
  filterLeadsByCountry,
  searchLeads,
  getAssignedLeadsCount,
  getAvailableCountries,
} from "../utils/LeadsUtils";
import { Lead } from "@/types/leads";
import { User } from "@/types/user.types";

// Local storage keys for filter persistence
const STORAGE_KEYS = {
  FILTER_BY_COUNTRY: "leads_filter_by_country",
  FILTER_BY_STATUS: "leads_filter_by_status",
  FILTER_BY_USER: "leads_filter_by_user",
  FILTER_BY_SOURCE: "leads_filter_by_source",
} as const;

export const useLeadsPage = (
  searchQuery: string,
  setLayoutLoading?: (loading: boolean) => void
) => {
  // ===== HOOKS & STATE =====
  const { data: session, status } = useSession();
  const router = useRouter();
  const isOnline = useNetworkStatus();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  // Initialize state
  const [isInitialized, setIsInitialized] = useState(false);

  // ⚡ Performance: Ref to prevent concurrent mutations
  const mutationInProgressRef = useRef(false);

  // ===== REACT QUERY HOOKS =====
  // Fetch leads with React Query - FIXED: Use consistent query key
  const {
    data: leads = [],
    isLoading: isLoadingLeads,
    isFetching: isRefetchingLeads,
    error: leadsError,
  } = useQuery({
    queryKey: ["leads"], // ✅ FIXED: Changed from ["leads", "all"] to ["leads"]
    queryFn: async (): Promise<Lead[]> => {
      const response = await fetch("/api/leads/all", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch leads");
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // ✅ FIXED: Reduced from 30 minutes to 2 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    refetchOnMount: false,
  });

  // Fetch users with React Query
  const {
    data: users = [],
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<User[]> => {
      const response = await fetch("/api/users", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      return Array.isArray(data) ? data : data.users || [];
    },
    staleTime: 2 * 60 * 1000, // ✅ FIXED: Reduced from 15 minutes to 2 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    refetchOnMount: false,
  });

  // Fetch statuses with React Query
  const {
    data: statuses = [],
    isLoading: isLoadingStatuses,
    error: statusesError,
  } = useQuery({
    queryKey: ["statuses"],
    queryFn: async (): Promise<
      Array<{ id: string; name: string; color?: string }>
    > => {
      const response = await fetch("/api/statuses", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch statuses");
      return response.json();
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    retry: 2,
    refetchOnMount: false,
  });

  // ===== ERROR HANDLING =====
  useEffect(() => {
    if (leadsError) {
      console.error("Leads query error:", leadsError);
      toast({
        title: "Error loading leads",
        description:
          leadsError instanceof Error
            ? leadsError.message
            : "Failed to load leads",
        variant: "destructive",
      });
    }
  }, [leadsError, toast]);

  useEffect(() => {
    if (usersError) {
      console.error("Users query error:", usersError);
      toast({
        title: "Error loading users",
        description:
          usersError instanceof Error
            ? usersError.message
            : "Failed to load users",
        variant: "destructive",
      });
    }
  }, [usersError, toast]);

  useEffect(() => {
    if (statusesError) {
      console.error("Statuses query error:", statusesError);
      toast({
        title: "Error loading statuses",
        description:
          statusesError instanceof Error
            ? statusesError.message
            : "Failed to load statuses",
        variant: "destructive",
      });
    }
  }, [statusesError, toast]);

  // ===== OPTIMIZED MUTATIONS =====
  const assignLeadsMutation = useMutation({
    mutationFn: async ({
      leadIds,
      userId,
    }: {
      leadIds: string[];
      userId: string;
    }) => {
      const response = await fetch("/api/leads/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds, userId }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to assign leads");
      return response.json();
    },
    onMutate: async ({ leadIds, userId }) => {
      // Prevent concurrent mutations
      if (mutationInProgressRef.current) {
        throw new Error("Another operation is in progress");
      }
      mutationInProgressRef.current = true;

      // Cancel any outgoing refetches - FIXED: Use consistent query key
      await queryClient.cancelQueries({ queryKey: ["leads"] });

      // Snapshot the previous value - FIXED: Use consistent query key
      const previousLeads = queryClient.getQueryData<Lead[]>(["leads"]);

      // Find the user for assignment
      const assignedUser = users.find((u) => u.id === userId);

      // ⚡ OPTIMISTIC UPDATE - Instant UI feedback - FIXED: Use consistent query key
      queryClient.setQueryData<Lead[]>(["leads"], (old = []) => {
        return old.map((lead) => {
          if (leadIds.includes(lead._id)) {
            return {
              ...lead,
              assignedTo: assignedUser
                ? {
                    id: assignedUser.id,
                    firstName: assignedUser.firstName,
                    lastName: assignedUser.lastName,
                  }
                : null,
            };
          }
          return lead;
        });
      });

      // Return context for rollback
      return { previousLeads };
    },
    onError: (err, variables, context) => {
      mutationInProgressRef.current = false;

      // Rollback on error - FIXED: Use consistent query key
      if (context?.previousLeads) {
        queryClient.setQueryData(["leads"], context.previousLeads);
      }
      toast({
        title: "Assignment failed",
        description:
          err instanceof Error ? err.message : "Failed to assign leads",
        variant: "destructive",
      });
    },
    onSuccess: (data, variables) => {
      mutationInProgressRef.current = false;

      toast({
        title: "Success!",
        description: `Successfully assigned ${variables.leadIds.length} lead(s)`,
        variant: "success",
      });
    },
    onSettled: () => {
      // Background refresh after delay - FIXED: Use consistent query key
      setTimeout(() => {
        if (!mutationInProgressRef.current) {
          queryClient.invalidateQueries({ queryKey: ["leads"] });
        }
      }, 2000);
    },
  });

  const unassignLeadsMutation = useMutation({
    mutationFn: async ({ leadIds }: { leadIds: string[] }) => {
      const response = await fetch("/api/leads/unassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to unassign leads");
      return response.json();
    },
    onMutate: async ({ leadIds }) => {
      // Prevent concurrent mutations
      if (mutationInProgressRef.current) {
        throw new Error("Another operation is in progress");
      }
      mutationInProgressRef.current = true;

      // Cancel any outgoing refetches - FIXED: Use consistent query key
      await queryClient.cancelQueries({ queryKey: ["leads"] });

      // Snapshot the previous value - FIXED: Use consistent query key
      const previousLeads = queryClient.getQueryData<Lead[]>(["leads"]);

      // ⚡ OPTIMISTIC UPDATE - Remove assignments instantly - FIXED: Use consistent query key
      queryClient.setQueryData<Lead[]>(["leads"], (old = []) => {
        return old.map((lead) => {
          if (leadIds.includes(lead._id)) {
            return {
              ...lead,
              assignedTo: null, // Clear assignment
            };
          }
          return lead;
        });
      });

      return { previousLeads };
    },
    onError: (err, variables, context) => {
      mutationInProgressRef.current = false;

      // Rollback on error - FIXED: Use consistent query key
      if (context?.previousLeads) {
        queryClient.setQueryData(["leads"], context.previousLeads);
      }
      toast({
        title: "Unassignment failed",
        description:
          err instanceof Error ? err.message : "Failed to unassign leads",
        variant: "destructive",
      });
    },
    onSuccess: (data, variables) => {
      mutationInProgressRef.current = false;

      toast({
        title: "Success!",
        description: `Successfully unassigned ${variables.leadIds.length} lead(s)`,
        variant: "success",
      });
    },
    onSettled: () => {
      // Background refresh after delay - FIXED: Use consistent query key
      setTimeout(() => {
        if (!mutationInProgressRef.current) {
          queryClient.invalidateQueries({ queryKey: ["leads"] });
        }
      }, 2000);
    },
  });

  // Bulk status change mutation
  const bulkStatusChangeMutation = useMutation({
    mutationFn: async ({
      leadIds,
      status,
    }: {
      leadIds: string[];
      status: string;
    }) => {
      const response = await fetch("/api/leads/bulk/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds, status }),
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to change lead statuses");
      }
      return response.json();
    },
    onMutate: async ({ leadIds, status }) => {
      if (mutationInProgressRef.current) {
        throw new Error("Another operation is in progress");
      }
      mutationInProgressRef.current = true;

      await queryClient.cancelQueries({ queryKey: ["leads"] });
      const previousLeads = queryClient.getQueryData<Lead[]>(["leads"]);

      // Optimistic update
      queryClient.setQueryData<Lead[]>(["leads"], (old = []) => {
        return old.map((lead) => {
          if (leadIds.includes(lead._id)) {
            return {
              ...lead,
              status,
              updatedAt: new Date().toISOString(),
            };
          }
          return lead;
        });
      });

      return { previousLeads };
    },
    onError: (err, variables, context) => {
      mutationInProgressRef.current = false;

      if (context?.previousLeads) {
        queryClient.setQueryData(["leads"], context.previousLeads);
      }
      toast({
        title: "Status change failed",
        description:
          err instanceof Error ? err.message : "Failed to change lead statuses",
        variant: "destructive",
      });
    },
    onSuccess: (data, variables) => {
      mutationInProgressRef.current = false;

      toast({
        title: "Success!",
        description: `Successfully changed status for ${variables.leadIds.length} lead(s)`,
        variant: "success",
      });
    },
    onSettled: () => {
      setTimeout(() => {
        if (!mutationInProgressRef.current) {
          queryClient.invalidateQueries({ queryKey: ["leads"] });
        }
      }, 2000);
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: async ({ leadIds }: { leadIds: string[] }) => {
      const response = await fetch("/api/leads/bulk/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds }),
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete leads");
      }
      return response.json();
    },
    onMutate: async ({ leadIds }) => {
      if (mutationInProgressRef.current) {
        throw new Error("Another operation is in progress");
      }
      mutationInProgressRef.current = true;

      await queryClient.cancelQueries({ queryKey: ["leads"] });
      const previousLeads = queryClient.getQueryData<Lead[]>(["leads"]);

      // Optimistic update - remove deleted leads
      queryClient.setQueryData<Lead[]>(["leads"], (old = []) => {
        return old.filter((lead) => !leadIds.includes(lead._id));
      });

      return { previousLeads };
    },
    onError: (err, variables, context) => {
      mutationInProgressRef.current = false;

      if (context?.previousLeads) {
        queryClient.setQueryData(["leads"], context.previousLeads);
      }
      toast({
        title: "Delete failed",
        description:
          err instanceof Error ? err.message : "Failed to delete leads",
        variant: "destructive",
      });
    },
    onSuccess: (data, variables) => {
      mutationInProgressRef.current = false;

      toast({
        title: "Success!",
        description: `Successfully deleted ${variables.leadIds.length} lead(s)`,
        variant: "success",
      });
    },
    onSettled: () => {
      setTimeout(() => {
        if (!mutationInProgressRef.current) {
          queryClient.invalidateQueries({ queryKey: ["leads"] });
        }
      }, 2000);
    },
  });

  // ===== STORE HOOKS =====
  const { selectedLeads, setSelectedLeads, filterByUser, setFilterByUser } =
    useLeadsStore();

  // ===== HELPER FUNCTIONS =====
  const getInitialFilterValue = (
    key: string,
    urlValue: string | null,
    defaultValue: string
  ) => {
    if (typeof window !== "undefined") {
      return urlValue || localStorage.getItem(key) || defaultValue;
    }
    return urlValue || defaultValue;
  };

  // ===== INITIAL FILTER VALUES =====
  const initialCountry = searchParams.get("country");
  const initialStatus = searchParams.get("status");
  const initialSource = searchParams.get("source");

  // ===== UI STATE =====
  const [uiState, setUiState] = useState({
    isDialogOpen: false,
    isUnassignDialogOpen: false,
    selectedUser: "",
    filterByCountry: getInitialFilterValue(
      STORAGE_KEYS.FILTER_BY_COUNTRY,
      initialCountry,
      "all"
    ),
    filterByStatus: getInitialFilterValue(
      STORAGE_KEYS.FILTER_BY_STATUS,
      initialStatus,
      "all"
    ),
    filterBySource: getInitialFilterValue(
      STORAGE_KEYS.FILTER_BY_SOURCE,
      initialSource,
      "all"
    ),
    searchQuery: searchQuery,
  });

  // ===== INITIALIZATION EFFECT =====
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // ===== LOCALSTORAGE PERSISTENCE =====
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(
        STORAGE_KEYS.FILTER_BY_COUNTRY,
        uiState.filterByCountry
      );
    }
  }, [uiState.filterByCountry, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(
        STORAGE_KEYS.FILTER_BY_STATUS,
        uiState.filterByStatus
      );
    }
  }, [uiState.filterByStatus, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(
        STORAGE_KEYS.FILTER_BY_SOURCE,
        uiState.filterBySource
      );
    }
  }, [uiState.filterBySource, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem(STORAGE_KEYS.FILTER_BY_USER, filterByUser);
    }
  }, [filterByUser, isInitialized]);

  // ===== STATE SYNC EFFECTS =====
  useEffect(() => {
    setUiState((prev) => ({ ...prev, searchQuery }));
  }, [searchQuery]);

  useEffect(() => {
    const urlCountry = searchParams.get("country");
    const urlStatus = searchParams.get("status");
    const urlSource = searchParams.get("source");

    const targetCountry = urlCountry || "all";
    if (targetCountry !== uiState.filterByCountry) {
      setUiState((prev) => ({ ...prev, filterByCountry: targetCountry }));
    }

    const targetStatus = urlStatus || "all";
    if (targetStatus !== uiState.filterByStatus) {
      setUiState((prev) => ({ ...prev, filterByStatus: targetStatus }));
    }

    const targetSource = urlSource || "all";
    if (targetSource !== uiState.filterBySource) {
      setUiState((prev) => ({ ...prev, filterBySource: targetSource }));
    }
  }, [
    searchParams,
    uiState.filterByCountry,
    uiState.filterByStatus,
    uiState.filterBySource,
  ]);

  useEffect(() => {
    if (setLayoutLoading) {
      setLayoutLoading(isLoadingLeads || isLoadingUsers || isLoadingStatuses);
    }
  }, [isLoadingLeads, isLoadingUsers, isLoadingStatuses, setLayoutLoading]);

  // ===== COMPUTED VALUES =====
  const availableCountries = useMemo(() => {
    return getAvailableCountries(leads);
  }, [leads]);

  const availableStatuses = useMemo(() => {
    return statuses.map((status) => status.name);
  }, [statuses]);

  const stableLeads = useMemo(() => {
    if (!leads || leads.length === 0) {
      return [];
    }
    return [...leads].sort((a, b) => a._id.localeCompare(b._id));
  }, [leads]);

  // ⚡ OPTIMIZED FILTERING - Reduced console.logs for performance
  const filteredLeads = useMemo(() => {
    let filtered = stableLeads;

    if (uiState.searchQuery.trim()) {
      filtered = searchLeads(filtered, uiState.searchQuery);
    }

    if (filterByUser !== "all") {
      filtered = filterLeadsByUser(filtered, filterByUser);
    }

    if (uiState.filterByCountry !== "all") {
      filtered = filterLeadsByCountry(filtered, uiState.filterByCountry);
    }

    if (uiState.filterByStatus !== "all") {
      // ✅ FIX: Build comprehensive mapping for status filtering
      const statusIdToName = statuses.reduce(
        (acc, status) => {
          if (status.id && status.name) {
            acc[status.id] = status.name;
          }
          return acc;
        },
        {} as Record<string, string>
      );

      const statusNameToId = statuses.reduce(
        (acc, status) => {
          if (status.id && status.name) {
            acc[status.name] = status.id;
            acc[status.name.toUpperCase()] = status.id;
            acc[status.name.toLowerCase()] = status.id;
          }
          return acc;
        },
        {} as Record<string, string>
      );

      // 🔍 DEBUG: Log status filtering
      console.log("🔍 Status Filter Debug:", {
        filterValue: uiState.filterByStatus,
        statusIdToName,
        statusNameToId,
        sampleLeadStatuses: filtered
          .slice(0, 3)
          .map((l) => ({ email: l.email, status: l.status })),
      });

      filtered = filtered.filter((lead) => {
        // Direct match (exact comparison)
        if (lead.status === uiState.filterByStatus) return true;

        // Case-insensitive match for status names
        if (lead.status?.toUpperCase() === uiState.filterByStatus.toUpperCase())
          return true;

        // Match if lead.status is an ID and maps to the filter name
        if (statusIdToName[lead.status] === uiState.filterByStatus) return true;

        // Match if filter is a name and maps to lead.status ID
        if (statusNameToId[uiState.filterByStatus] === lead.status) return true;

        // Also check case-insensitive mapping
        const filterUpper = uiState.filterByStatus.toUpperCase();
        const filterLower = uiState.filterByStatus.toLowerCase();
        if (statusNameToId[filterUpper] === lead.status) return true;
        if (statusNameToId[filterLower] === lead.status) return true;

        return false;
      });

      console.log("🔍 After status filter:", filtered.length, "leads match");
    }

    if (uiState.filterBySource !== "all") {
      filtered = filtered.filter(
        (lead) => lead.source === uiState.filterBySource
      );
    }

    return filtered;
  }, [
    stableLeads,
    uiState.searchQuery,
    filterByUser,
    uiState.filterByCountry,
    uiState.filterByStatus,
    uiState.filterBySource,
    statuses,
  ]);

  const counts = useMemo(() => {
    return {
      total: leads.length,
      filtered: filteredLeads.length,
      assigned: getAssignedLeadsCount(selectedLeads),
      countries: availableCountries.length,
    };
  }, [
    leads.length,
    filteredLeads.length,
    selectedLeads,
    availableCountries.length,
  ]);

  const shouldShowLoading =
    isLoadingLeads || isLoadingUsers || isLoadingStatuses;
  const showEmptyState =
    !shouldShowLoading && filteredLeads.length === 0 && leads.length === 0;

  // ===== OPTIMIZED EVENT HANDLERS =====
  const handleAssignLeads = useCallback(async () => {
    if (selectedLeads.length === 0 || !uiState.selectedUser) {
      toast({
        title: "No leads selected",
        description: "Please select leads to assign",
        variant: "destructive",
      });
      return;
    }

    try {
      await assignLeadsMutation.mutateAsync({
        leadIds: selectedLeads.map((l) => l._id),
        userId: uiState.selectedUser,
      });

      // ⚡ Clear selection immediately for instant feedback
      setSelectedLeads([]);
      setUiState((prev) => ({
        ...prev,
        isDialogOpen: false,
        selectedUser: "",
      }));
    } catch (error) {
      // Error handling is done in mutation
      console.error("Assignment error:", error);
    }
  }, [
    selectedLeads,
    uiState.selectedUser,
    assignLeadsMutation,
    setSelectedLeads,
    toast,
  ]);

  const handleUnassignLeads = useCallback(async () => {
    const leadsToUnassign = selectedLeads.filter(
      (lead) => !!getAssignedUserId(lead.assignedTo)
    );

    if (leadsToUnassign.length === 0) {
      setUiState((prev) => ({ ...prev, isUnassignDialogOpen: false }));
      toast({
        title: "No assigned leads",
        description: "Selected leads are not assigned to anyone",
        variant: "destructive",
      });
      return;
    }

    try {
      await unassignLeadsMutation.mutateAsync({
        leadIds: leadsToUnassign.map((l) => l._id),
      });

      // ⚡ Clear selection immediately for instant feedback
      setSelectedLeads([]);
      setUiState((prev) => ({ ...prev, isUnassignDialogOpen: false }));
    } catch (error) {
      // Error handling is done in mutation
      console.error("Unassignment error:", error);
    }
  }, [selectedLeads, unassignLeadsMutation, setSelectedLeads, toast]);

  const handleBulkStatusChange = useCallback(
    async (statusId: string) => {
      if (selectedLeads.length === 0) {
        toast({
          title: "No leads selected",
          description: "Please select leads to change status",
          variant: "destructive",
        });
        return;
      }

      try {
        await bulkStatusChangeMutation.mutateAsync({
          leadIds: selectedLeads.map((l) => l._id),
          status: statusId,
        });

        // Clear selection after successful change
        setSelectedLeads([]);
      } catch (error) {
        // Error handling is done in mutation
        console.error("Bulk status change error:", error);
      }
    },
    [selectedLeads, bulkStatusChangeMutation, setSelectedLeads, toast]
  );

  const handleBulkDelete = useCallback(async () => {
    if (selectedLeads.length === 0) {
      toast({
        title: "No leads selected",
        description: "Please select leads to delete",
        variant: "destructive",
      });
      return;
    }

    try {
      await bulkDeleteMutation.mutateAsync({
        leadIds: selectedLeads.map((l) => l._id),
      });

      // Clear selection after successful delete
      setSelectedLeads([]);
    } catch (error) {
      // Error handling is done in mutation
      console.error("Bulk delete error:", error);
    }
  }, [selectedLeads, bulkDeleteMutation, setSelectedLeads, toast]);

  const handleSelectionChange = useCallback(
    (newSelectedLeads: Lead[]) => setSelectedLeads(newSelectedLeads),
    [setSelectedLeads]
  );

  const handleCountryFilterChange = useCallback(
    (country: string) => {
      setUiState((prev) => ({
        ...prev,
        filterByCountry: country,
      }));

      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.set("page", "1");

      if (country === "all") {
        params.delete("country");
      } else {
        params.set("country", country);
      }

      window.history.replaceState({}, "", `${pathname}?${params.toString()}`);
    },
    [pathname, searchParams]
  );

  const handleStatusFilterChange = useCallback(
    (status: string) => {
      setUiState((prev) => ({
        ...prev,
        filterByStatus: status,
      }));

      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.set("page", "1");
      if (status === "all") {
        params.delete("status");
      } else {
        params.set("status", status);
      }
      window.history.replaceState({}, "", `${pathname}?${params.toString()}`);
    },
    [pathname, searchParams]
  );

  const handleSourceFilterChange = useCallback(
    (source: string) => {
      setUiState((prev) => ({
        ...prev,
        filterBySource: source,
      }));

      const params = new URLSearchParams(Array.from(searchParams.entries()));
      params.set("page", "1");
      if (source === "all") {
        params.delete("source");
      } else {
        params.set("source", source);
      }
      window.history.replaceState({}, "", `${pathname}?${params.toString()}`);
    },
    [pathname, searchParams]
  );

  const handleFilterChange = useCallback(
    (value: string) => {
      setFilterByUser(value);

      const params = new URLSearchParams(window.location.search);
      params.set("page", "1");
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}?${params.toString()}`
      );
    },
    [setFilterByUser]
  );

  const hasAssignedLeads = selectedLeads.some(
    (lead) => !!getAssignedUserId(lead.assignedTo)
  );

  // ===== RETURN OBJECT =====
  return {
    session,
    status,
    router,
    isOnline,
    leads,
    users,
    statuses,
    isLoadingLeads,
    isRefetchingLeads,
    isLoadingUsers,
    isLoadingStatuses,
    isAssigning: assignLeadsMutation.isPending,
    isUnassigning: unassignLeadsMutation.isPending,
    selectedLeads,
    filterByUser,
    uiState,
    setUiState,
    filteredLeads,
    counts,
    shouldShowLoading,
    showEmptyState,
    availableCountries,
    availableStatuses,
    handleAssignLeads,
    handleUnassignLeads,
    handleBulkStatusChange,
    handleBulkDelete,
    handleSelectionChange,
    handleCountryFilterChange,
    handleStatusFilterChange,
    handleSourceFilterChange,
    handleFilterChange,
    hasAssignedLeads,
    isInitializing: !isInitialized,
  };
};
