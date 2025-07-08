"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  const { data: session, status } = useSession();
  const router = useRouter();
  const isOnline = useNetworkStatus();

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
    filterByCountry: "all",
    searchQuery: searchQuery,
  });

  // Sync searchQuery prop with local state
  useEffect(() => {
    setUiState((prev) => ({ ...prev, searchQuery }));
  }, [searchQuery]);

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

  const handleCountryFilterChange = useCallback((country: string) => {
    setUiState((prev) => ({ ...prev, filterByCountry: country }));
  }, []);

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
    <div className="flex flex-col h-full bg-background dark:bg-gray-800 border-2  rounded-md">
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
