// src/hooks/useLeadsPage.ts
import { useState, useMemo, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useLeads } from "@/hooks/useLeads";
import { useLeadsStore } from "@/stores/leadsStore";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import {
  getAssignedUserId,
  filterLeadsByUser,
  filterLeadsByCountry,
  searchLeads,
  getAssignedLeadsCount,
  getAvailableCountries,
} from "../utils/LeadsUtils";
import { Lead } from "@/types/leads";

export const useLeadsPage = (
  searchQuery: string,
  setLayoutLoading?: (loading: boolean) => void
) => {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const isOnline = useNetworkStatus();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Get initial filters from URL
  const initialCountry = searchParams.get("country") || "all";
  const initialStatus = searchParams.get("status") || "all";

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
    filterByCountry: initialCountry,
    filterByStatus: initialStatus,
    searchQuery: searchQuery,
  });

  // Debug statuses
  useEffect(() => {
    console.log("🔍 STATUSES DEBUG:", {
      statusesLength: statuses.length,
      statuses: statuses.map((s) => ({
        id: s.id,
        name: s.name,
        color: s.color,
      })),
      isLoadingStatuses: isLoadingUsers,
    });
  }, [statuses, isLoadingUsers]);

  // Session refresh logic
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (
        document.visibilityState === "visible" &&
        status === "authenticated"
      ) {
        try {
          const response = await fetch("/api/users", {
            credentials: "include",
          });

          if (response.status === 401) {
            await update();
          }
        } catch (error) {
          console.error("Session check failed:", error);
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

  // Sync filters with URL changes
  useEffect(() => {
    const urlCountry = searchParams.get("country") || "all";
    const urlStatus = searchParams.get("status") || "all";

    setUiState((prev) => ({
      ...prev,
      filterByCountry: urlCountry,
      filterByStatus: urlStatus,
    }));
  }, [searchParams]);

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

  // STABILIZED LEADS DATA
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
      console.log("📈 Applying status filter:", uiState.filterByStatus);

      const statusIdToName = statuses.reduce(
        (acc, status) => {
          if (status.id && status.name) {
            acc[status.id] = status.name;
          }
          return acc;
        },
        {} as Record<string, string>
      );

      console.log("🔍 STATUS MAPPING:", statusIdToName);

      const uniqueStatuses = [...new Set(filtered.map((lead) => lead.status))];
      console.log(" LEAD STATUS VALUES:", {
        totalLeads: filtered.length,
        uniqueStatuses: uniqueStatuses,
        statusCounts: uniqueStatuses.reduce(
          (acc, status) => {
            acc[status] = filtered.filter(
              (lead) => lead.status === status
            ).length;
            return acc;
          },
          {} as Record<string, number>
        ),
        mappedStatuses: uniqueStatuses.map((status) => ({
          original: status,
          mapped: statusIdToName[status] || status,
        })),
        sampleLeads: filtered.slice(0, 5).map((lead) => ({
          id: lead._id,
          status: lead.status,
          statusName: statusIdToName[lead.status] || lead.status,
          statusType: typeof lead.status,
        })),
      });

      filtered = filtered.filter((lead) => {
        const directMatch = lead.status === uiState.filterByStatus;
        const mappedMatch =
          statusIdToName[lead.status] === uiState.filterByStatus;

        const matches = directMatch || mappedMatch;

        if (matches) {
          console.log("✅ Status match found:", {
            leadId: lead._id,
            originalStatus: lead.status,
            statusName: statusIdToName[lead.status] || lead.status,
            filterBy: uiState.filterByStatus,
          });
        }
        return matches;
      });

      console.log("📈 Status filter result:", {
        statusFilter: uiState.filterByStatus,
        resultCount: filtered.length,
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

  const handleAssignLeads = useCallback(async () => {
    if (selectedLeads.length === 0 || !uiState.selectedUser) return;

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
    } catch (error) {
      console.error("Assignment error:", error);
    }
  }, [selectedLeads, uiState.selectedUser, assignLeads, setSelectedLeads]);

  const handleUnassignLeads = useCallback(async () => {
    const leadsToUnassign = selectedLeads.filter(
      (lead) => !!getAssignedUserId(lead.assignedTo)
    );

    if (leadsToUnassign.length === 0) {
      setUiState((prev) => ({ ...prev, isUnassignDialogOpen: false }));
      return;
    }

    try {
      await unassignLeads({
        leadIds: leadsToUnassign.map((l) => l._id),
      });
      setSelectedLeads([]);
      setUiState((prev) => ({ ...prev, isUnassignDialogOpen: false }));
    } catch (error) {
      console.error("Unassignment error:", error);
    }
  }, [selectedLeads, unassignLeads, setSelectedLeads]);

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
