// src/components/dashboardComponents/LeadsPageContent.tsx
"use client";

import { useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LeadsTable from "@/components/dashboardComponents/LeadsTable";
import EmptyState from "@/components/dashboardComponents/EmptyState";
import { LeadsHeader } from "./LeadHeader";
import { LeadsFilterControls } from "./LeadFilter";
import { LeadsDialogs } from "./LeadDialog";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import {
  TableSkeleton,
  LoadingSpinner,
  ErrorBoundary,
} from "./LeadsLoadingState";
import { useLeadsPage } from "@/hooks/useLeadsPage";

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
  } = useLeadsPage(searchQuery, setLayoutLoading);

  const handleLeadUpdate = useCallback(async () => {
    return true;
  }, []);

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
    <div className="flex flex-col h-full bg-background dark:bg-gray-800 border-1 rounded-lg">
      <LeadsHeader shouldShowLoading={shouldShowLoading} counts={counts} />

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
        filterByStatus={uiState.filterByStatus}
        onStatusFilterChange={handleStatusFilterChange}
        availableCountries={availableCountries}
        availableStatuses={availableStatuses}
        isLoading={isLoading}
        filterByUser={filterByUser}
        onFilterChange={handleFilterChange}
        users={users}
        isLoadingUsers={isLoadingUsers}
      />

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
                  filterByStatus={uiState.filterByStatus}
                  users={users}
                />
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <LeadsTable
                  key={`leads-table-${leads.length}-${filterByUser}-${uiState.filterByCountry}-${uiState.filterByStatus}`}
                  leads={filteredLeads}
                  onLeadUpdated={handleLeadUpdate}
                  isLoading={isLoading}
                  selectedLeads={selectedLeads}
                  users={users}
                  onSelectionChange={handleSelectionChange}
                  searchQuery={uiState.searchQuery}
                  filterByUser={filterByUser}
                  filterByCountry={uiState.filterByCountry}
                  filterByStatus={uiState.filterByStatus}
                />
              </div>
            )}
          </Suspense>
        </ErrorBoundary>
      </div>

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
