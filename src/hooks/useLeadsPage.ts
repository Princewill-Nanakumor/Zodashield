// src/hooks/useLeadsPage.ts
import { useState, useMemo, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useLeads } from "@/hooks/useLeads";
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
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const isOnline = useNetworkStatus();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Helper function to get initial filter values from localStorage or URL
  const getInitialFilterValue = (
    key: string,
    urlValue: string | null,
    defaultValue: string
  ) => {
    if (typeof window !== "undefined") {
      // Prioritize URL parameters, then localStorage, then default
      return urlValue || localStorage.getItem(key) || defaultValue;
    }
    return urlValue || defaultValue;
  };

  // Get initial filters from URL
  const initialCountry = searchParams.get("country");
  const initialStatus = searchParams.get("status");

  const {
    leads,
    users,
    statuses,
    isLoadingLeads,
    isLoadingUsers,
    assignLeads,
    unassignLeads,
    isAssigning,
    isUnassigning,
  } = useLeads();

  const { selectedLeads, setSelectedLeads, filterByUser, setFilterByUser } =
    useLeadsStore();

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

  // Save filter values to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.FILTER_BY_COUNTRY,
      uiState.filterByCountry
    );
  }, [uiState.filterByCountry]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FILTER_BY_STATUS, uiState.filterByStatus);
  }, [uiState.filterByStatus]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FILTER_BY_USER, filterByUser);
  }, [filterByUser]);

  // Improved session refresh logic with timeout handling
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (
        document.visibilityState === "visible" &&
        status === "authenticated"
      ) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          const response = await fetch("/api/users", {
            credentials: "include",
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.status === 401) {
            await update();
          }
        } catch (error) {
          console.error("Session check failed:", error);
          if (error instanceof Error && error.name === "AbortError") {
            console.log("Session check timed out, continuing...");
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (status === "authenticated") {
      handleVisibilityChange();
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [status, update]);

  // Sync searchQuery prop with local state
  useEffect(() => {
    setUiState((prev) => ({ ...prev, searchQuery }));
  }, [searchQuery]);

  // Sync filters with URL changes (but don't override localStorage on initial load)
  useEffect(() => {
    const urlCountry = searchParams.get("country");
    const urlStatus = searchParams.get("status");

    // Only update if URL parameters are different from current state
    // This prevents overriding localStorage values on initial load
    if (urlCountry !== null && urlCountry !== uiState.filterByCountry) {
      setUiState((prev) => ({ ...prev, filterByCountry: urlCountry }));
    }
    if (urlStatus !== null && urlStatus !== uiState.filterByStatus) {
      setUiState((prev) => ({ ...prev, filterByStatus: urlStatus }));
    }
  }, [searchParams, uiState.filterByCountry, uiState.filterByStatus]);

  // Update layout loading state with better error handling
  useEffect(() => {
    if (setLayoutLoading) {
      setLayoutLoading(isLoadingLeads || isLoadingUsers);
    }
  }, [isLoadingLeads, isLoadingUsers, setLayoutLoading]);

  const availableCountries = useMemo(() => {
    return getAvailableCountries(leads);
  }, [leads]);

  const availableStatuses = useMemo(() => {
    return statuses.map((status) => status.name);
  }, [statuses]);

  // STABILIZED LEADS DATA with better error handling
  const stableLeads = useMemo(() => {
    if (!leads || leads.length === 0) {
      return [];
    }
    const sorted = [...leads].sort((a, b) => a._id.localeCompare(b._id));
    return sorted;
  }, [leads]);

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

  const shouldShowLoading = isLoadingLeads || isLoadingUsers;
  const showEmptyState =
    !shouldShowLoading && filteredLeads.length === 0 && leads.length === 0;

  // Improved assignment handler with better error handling
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
      await assignLeads({
        leadIds: selectedLeads.map((l) => l._id),
        userId: uiState.selectedUser,
      });
      setSelectedLeads([]);
      setUiState((prev) => ({
        ...prev,
        isDialogOpen: false,
        selectedUser: "",
      }));

      toast({
        title: "Leads assigned successfully",
        description: `${selectedLeads.length} lead(s) have been assigned`,
        variant: "success",
      });
    } catch (error) {
      console.error("Assignment error:", error);
      toast({
        title: "Assignment failed",
        description:
          error instanceof Error ? error.message : "Failed to assign leads",
        variant: "destructive",
      });
    }
  }, [
    selectedLeads,
    uiState.selectedUser,
    assignLeads,
    setSelectedLeads,
    toast,
  ]);

  // Improved unassignment handler with better error handling
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
      await unassignLeads({
        leadIds: leadsToUnassign.map((l) => l._id),
      });
      setSelectedLeads([]);
      setUiState((prev) => ({ ...prev, isUnassignDialogOpen: false }));

      toast({
        title: "Leads unassigned successfully",
        description: `${leadsToUnassign.length} lead(s) have been unassigned`,
        variant: "success",
      });
    } catch (error) {
      console.error("Unassignment error:", error);
      toast({
        title: "Unassignment failed",
        description:
          error instanceof Error ? error.message : "Failed to unassign leads",
        variant: "destructive",
      });
    }
  }, [selectedLeads, unassignLeads, setSelectedLeads, toast]);

  const handleSelectionChange = useCallback(
    (newSelectedLeads: Lead[]) => setSelectedLeads(newSelectedLeads),
    [setSelectedLeads]
  );

  const handleCountryFilterChange = useCallback(
    (country: string) => {
      setUiState((prev) => ({ ...prev, filterByCountry: country }));

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
      setUiState((prev) => ({ ...prev, filterByStatus: status }));

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

  return {
    session,
    status,
    router,
    isOnline,
    leads,
    users,
    statuses,
    isLoadingLeads,
    isLoadingUsers,
    isAssigning,
    isUnassigning,
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
  };
};
