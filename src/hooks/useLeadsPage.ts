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

  // Debug statuses with better error handling
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
      console.log("�� No leads available in stableLeads");
      return [];
    }
    const sorted = [...leads].sort((a, b) => a._id.localeCompare(b._id));
    console.log("�� Stable leads count:", sorted.length);
    return sorted;
  }, [leads]);

  const filteredLeads = useMemo(() => {
    let filtered = stableLeads;

    console.log("🔍 FILTERING PROCESS DEBUG:", {
      initialCount: filtered.length,
      searchQuery: uiState.searchQuery,
      filterByUser,
      filterByCountry: uiState.filterByCountry,
      filterByStatus: uiState.filterByStatus,
      statusesCount: statuses.length,
      // Remove this line since it's not needed for filtering logic
      // statusesLoaded: !isLoadingUsers,
      statusesWithValidIds: statuses.filter((s) => s.id && s.name).length,
    });

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
      console.log("📈 STATUS FILTER DEBUG START:", {
        filterByStatus: uiState.filterByStatus,
        statusesAvailable: statuses,
        leadsBeforeFilter: filtered.length,
        statusesWithValidIds: statuses.filter((s) => s.id && s.name).length,
      });

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

      console.log("STATUS MAPPINGS:", {
        idToName: statusIdToName,
        nameToId: statusNameToId,
      });

      const uniqueStatuses = [...new Set(filtered.map((lead) => lead.status))];
      console.log("LEAD STATUS VALUES:", {
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

      const beforeCount = filtered.length;
      filtered = filtered.filter((lead) => {
        const directMatch = lead.status === uiState.filterByStatus;
        const mappedMatch =
          statusIdToName[lead.status] === uiState.filterByStatus;
        const reverseMatch =
          statusNameToId[uiState.filterByStatus] === lead.status;

        const matches = directMatch || mappedMatch || reverseMatch;

        if (matches) {
          console.log("✅ Status match found:", {
            leadId: lead._id,
            originalStatus: lead.status,
            statusName: statusIdToName[lead.status] || lead.status,
            filterBy: uiState.filterByStatus,
            directMatch,
            mappedMatch,
            reverseMatch,
          });
        }
        return matches;
      });

      const afterCount = filtered.length;
      console.log("📈 STATUS FILTER RESULT:", {
        statusFilter: uiState.filterByStatus,
        beforeCount,
        afterCount,
        removed: beforeCount - afterCount,
        matchesFound: afterCount,
        statusIdToNameMapping: statusIdToName,
      });
    }

    console.log("🎯 FINAL FILTERED LEADS:", {
      finalCount: filtered.length,
      sampleFinalLeads: filtered.slice(0, 3).map((l) => ({
        id: l._id,
        status: l.status,
        assignedTo: l.assignedTo,
      })),
    });

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
