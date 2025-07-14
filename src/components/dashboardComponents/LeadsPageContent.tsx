// /Users/safeconnection/Downloads/drivecrm/src/components/dashboardComponents/LeadsPageContent.tsx

"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useMemo, useCallback, Suspense, useEffect } from "react";
import { useLeads } from "@/hooks/useLeads";
import { useLeadsStore } from "@/stores/leadsStore";
import LeadsTable from "@/components/dashboardComponents/LeadsTable";
import EmptyState from "@/components/dashboardComponents/EmptyState";
import { LeadsHeader } from "./LeadHeader";
import { LeadsFilterControls } from "./LeadFilter";
import { LeadsDialogs } from "./LeadDialog";
import {
  getAssignedUserId,
  filterLeadsByUser,
  filterLeadsByCountry,
  searchLeads,
  getAssignedLeadsCount,
  getAvailableCountries,
} from "@/utils/LeadsUtils";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import {
  TableSkeleton,
  LoadingSpinner,
  ErrorBoundary,
} from "./LeadsLoadingState";
import { Lead } from "@/types/leads";

const USER_ROLES = {
  ADMIN: "ADMIN",
} as const;

interface LeadsPageContentProps {
  searchQuery?: string;
  isLoading?: boolean;
  setLayoutLoading?: (loading: boolean) => void;
}

const LeadsPageContent: React.FC<LeadsPageContentProps> = ({
  searchQuery = "",
  isLoading = false,
  setLayoutLoading,
}) => {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const isOnline = useNetworkStatus();

  // URL query sync
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Get initial country filter from URL
  const initialCountry = searchParams.get("country") || "all";

  const {
    leads,
    users,
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
    searchQuery: searchQuery,
  });

  // Session refresh logic - ADD THIS SECTION
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
            console.log("Session expired, refreshing...");
            await update(); // Refresh the session
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

  // Sync filterByCountry with URL changes (e.g. user edits URL)
  useEffect(() => {
    const urlCountry = searchParams.get("country") || "all";
    setUiState((prev) => ({ ...prev, filterByCountry: urlCountry }));
  }, [searchParams]);

  useEffect(() => {
    if (setLayoutLoading) {
      setLayoutLoading(isLoadingLeads || isLoadingUsers);
    }
  }, [isLoadingLeads, isLoadingUsers, setLayoutLoading]);

  const handleLeadUpdate = useCallback(async (updatedLead: Lead) => {
    console.log("Lead update requested:", updatedLead._id);
    return true;
  }, []);

  const availableCountries = useMemo(() => {
    return getAvailableCountries(leads);
  }, [leads]);

  const filteredLeads = useMemo(() => {
    let filtered = leads;

    // Apply search filter first
    if (uiState.searchQuery.trim()) {
      filtered = searchLeads(filtered, uiState.searchQuery);
    }

    // Apply user filter
    if (filterByUser !== "all") {
      filtered = filterLeadsByUser(filtered, filterByUser);
    }

    // Apply country filter
    if (uiState.filterByCountry !== "all") {
      filtered = filterLeadsByCountry(filtered, uiState.filterByCountry);
    }

    return filtered;
  }, [leads, uiState.searchQuery, filterByUser, uiState.filterByCountry]);

  const counts = useMemo(
    () => ({
      total: leads.length,
      filtered: filteredLeads.length,
      assigned: getAssignedLeadsCount(selectedLeads),
      countries: availableCountries.length,
    }),
    [
      leads.length,
      filteredLeads.length,
      selectedLeads,
      availableCountries.length,
    ]
  );

  const shouldShowLoading = isLoadingLeads || isLoadingUsers;
  const showEmptyState =
    !shouldShowLoading &&
    !isLoading &&
    filteredLeads.length === 0 &&
    leads.length === 0;

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

  // --- URL sync for country filter ---
  const handleCountryFilterChange = useCallback(
    (country: string) => {
      setUiState((prev) => ({ ...prev, filterByCountry: country }));

      // Update the URL query string
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      if (country === "all") {
        params.delete("country");
      } else {
        params.set("country", country);
      }
      // Use replace to avoid adding to browser history
      window.history.replaceState({}, "", `${pathname}?${params.toString()}`);
    },
    [pathname, searchParams]
  );
  // ---

  const handleFilterChange = useCallback(
    (value: string) => setFilterByUser(value),
    [setFilterByUser]
  );

  const hasAssignedLeads = selectedLeads.some(
    (lead) => !!getAssignedUserId(lead.assignedTo)
  );

  // Show offline message
  if (!isOnline) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500">
            You are offline. Please check your connection.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return <LoadingSpinner />;
  }

  if (status === "unauthenticated") {
    router.push("/signin");
    return null;
  }

  if (!session?.user?.role || session.user.role !== USER_ROLES.ADMIN) {
    router.push("/dashboard");
    return null;
  }

  return (
    <div className="flex flex-col h-full bg-background dark:bg-gray-800 border-1  rounded-lg">
      {/* Header */}
      <LeadsHeader shouldShowLoading={shouldShowLoading} counts={counts} />

      {/* Filter Controls */}
      <LeadsFilterControls
        selectedLeads={selectedLeads}
        hasAssignedLeads={hasAssignedLeads}
        assignedLeadsCount={counts.assigned}
        isUpdating={isAssigning || isUnassigning}
        onAssign={() => setUiState((prev) => ({ ...prev, isDialogOpen: true }))}
        onUnassign={() =>
          setUiState((prev) => ({
            ...prev,
            isUnassignDialogOpen: true,
          }))
        }
        filterByCountry={uiState.filterByCountry}
        onCountryFilterChange={handleCountryFilterChange}
        availableCountries={availableCountries}
        isLoading={isLoading}
        filterByUser={filterByUser}
        onFilterChange={handleFilterChange}
        users={users}
        isLoadingUsers={isLoadingUsers}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <ErrorBoundary
          fallback={<div className="text-red-500">Table failed to load</div>}
        >
          <Suspense fallback={<TableSkeleton />}>
            {shouldShowLoading ? (
              <TableSkeleton />
            ) : showEmptyState ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <EmptyState
                  filterByUser={filterByUser}
                  filterByCountry={uiState.filterByCountry}
                  users={users}
                />
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <LeadsTable
                  leads={filteredLeads}
                  onLeadUpdated={handleLeadUpdate}
                  isLoading={isLoading}
                  selectedLeads={selectedLeads}
                  users={users}
                  onSelectionChange={handleSelectionChange}
                  searchQuery={uiState.searchQuery}
                  filterByUser={filterByUser}
                  filterByCountry={uiState.filterByCountry}
                />
              </div>
            )}
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Dialogs */}
      <LeadsDialogs
        isDialogOpen={uiState.isDialogOpen}
        onDialogClose={() =>
          setUiState((prev) => ({
            ...prev,
            isDialogOpen: false,
            selectedUser: "",
          }))
        }
        users={users}
        selectedUser={uiState.selectedUser}
        setSelectedUser={(user) =>
          setUiState((prev) => ({ ...prev, selectedUser: user }))
        }
        isLoadingUsers={isLoadingUsers}
        isAssigning={isAssigning}
        onAssign={handleAssignLeads}
        onUnassign={handleUnassignLeads}
        selectedLeads={selectedLeads}
        isUnassignDialogOpen={uiState.isUnassignDialogOpen}
        onUnassignDialogChange={(open) =>
          setUiState((prev) => ({ ...prev, isUnassignDialogOpen: open }))
        }
        isUnassigning={isUnassigning}
        assignedLeadsCount={counts.assigned}
      />
    </div>
  );
};

export default LeadsPageContent;
