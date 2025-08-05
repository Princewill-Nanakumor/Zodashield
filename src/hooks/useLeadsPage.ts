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
  // Fetch leads with React Query
  const {
    data: leads = [],
    isLoading: isLoadingLeads,
    isFetching: isRefetchingLeads,
    error: leadsError,
  } = useQuery({
    queryKey: ["leads", "all"],
    queryFn: async (): Promise<Lead[]> => {
      const response = await fetch("/api/leads/all", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch leads");
      return response.json();
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
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
    staleTime: 15 * 60 * 1000, // 15 minutes
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

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["leads", "all"] });

      // Snapshot the previous value
      const previousLeads = queryClient.getQueryData<Lead[]>(["leads", "all"]);

      // Find the user for assignment
      const assignedUser = users.find((u) => u.id === userId);

      // ⚡ OPTIMISTIC UPDATE - Instant UI feedback
      queryClient.setQueryData<Lead[]>(["leads", "all"], (old = []) => {
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

      // Show immediate feedback
      toast({
        title: "Assigning leads...",
        description: `Assigning ${leadIds.length} lead(s)...`,
        variant: "default",
      });

      // Return context for rollback
      return { previousLeads };
    },
    onError: (err, variables, context) => {
      mutationInProgressRef.current = false;

      // Rollback on error
      if (context?.previousLeads) {
        queryClient.setQueryData(["leads", "all"], context.previousLeads);
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
      // Background refresh after delay
      setTimeout(() => {
        if (!mutationInProgressRef.current) {
          queryClient.invalidateQueries({ queryKey: ["leads", "all"] });
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

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["leads", "all"] });

      // Snapshot the previous value
      const previousLeads = queryClient.getQueryData<Lead[]>(["leads", "all"]);

      // ⚡ OPTIMISTIC UPDATE - Remove assignments instantly
      queryClient.setQueryData<Lead[]>(["leads", "all"], (old = []) => {
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

      // Show immediate feedback
      toast({
        title: "Unassigning leads...",
        description: `Unassigning ${leadIds.length} lead(s)...`,
        variant: "default",
      });

      return { previousLeads };
    },
    onError: (err, variables, context) => {
      mutationInProgressRef.current = false;

      // Rollback on error
      if (context?.previousLeads) {
        queryClient.setQueryData(["leads", "all"], context.previousLeads);
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
      // Background refresh after delay
      setTimeout(() => {
        if (!mutationInProgressRef.current) {
          queryClient.invalidateQueries({ queryKey: ["leads", "all"] });
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

    const targetCountry = urlCountry || "all";
    if (targetCountry !== uiState.filterByCountry) {
      setUiState((prev) => ({ ...prev, filterByCountry: targetCountry }));
    }

    const targetStatus = urlStatus || "all";
    if (targetStatus !== uiState.filterByStatus) {
      setUiState((prev) => ({ ...prev, filterByStatus: targetStatus }));
    }
  }, [searchParams, uiState.filterByCountry, uiState.filterByStatus]);

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
          }
          return acc;
        },
        {} as Record<string, string>
      );

      filtered = filtered.filter((lead) => {
        const directMatch = lead.status === uiState.filterByStatus;
        const mappedMatch =
          statusIdToName[lead.status] === uiState.filterByStatus;
        const reverseMatch =
          statusNameToId[uiState.filterByStatus] === lead.status;
        return directMatch || mappedMatch || reverseMatch;
      });
    }

    return filtered;
  }, [
    stableLeads,
    uiState.searchQuery,
    filterByUser,
    uiState.filterByCountry,
    uiState.filterByStatus,
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
    handleSelectionChange,
    handleCountryFilterChange,
    handleStatusFilterChange,
    handleFilterChange,
    hasAssignedLeads,
    isInitializing: !isInitialized,
  };
};
