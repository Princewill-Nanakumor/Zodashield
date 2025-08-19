// src/components/leads/UserLeadsContent.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lead } from "@/types/leads";
import { CountsData } from "@/types/pagination.types";
import LeadDetailsPanel from "@/components/dashboardComponents/LeadDetailsPanel";
import { UserLeadsHeader } from "@/components/leads/UserLeadsHeader";
import { UserLeadsFilterControls } from "@/components/leads/UserLeadsFilterControls";
import {
  LoadingSpinner,
  TableSkeleton,
} from "@/components/leads/UserLeadsLoadingStates";
import { FilterLogic } from "@/components/user-leads/FilterLogic";
import { URLStateManager } from "../user-leads/URLStatemanager";
import { SubscriptionGuard } from "@/components/user-leads/SubscriptionGuard";
import { UserLeadsTableContainer } from "@/components/user-leads/UserLeadsTableContainer";
import { useSubscriptionData } from "@/hooks/useSubscriptionData";
import { useLeadsURLManagement } from "@/hooks/useLeadsURLManagement";
import { usePagination } from "@/hooks/paginationUtils";
import { useSearchContext } from "@/context/SearchContext";
import { useToggleContext } from "@/context/ToggleContext";
import { useAssignedLeads } from "@/hooks/useAssignedLeads";
import { RefetchIndicator } from "@/components/ui/RefetchIndicator";

type SortField = "name" | "country" | "status" | "source" | "createdAt";
type SortOrder = "asc" | "desc";

export default function UserLeadsContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { searchQuery } = useSearchContext();
  const toggleContext = useToggleContext();

  // Use toggle context if available, otherwise default values
  const showHeader = toggleContext?.showHeader ?? true;
  const showControls = toggleContext?.showControls ?? true;

  // React Query hook for leads data
  const { leads, isLoading, isFetching, isError, error, updateLead } =
    useAssignedLeads();

  // React Query hook for subscription (prevents flashing)
  const {
    subscriptionData,
    hasActiveSubscription,
    isLoading: subscriptionLoading,
  } = useSubscriptionData();

  // Local state for UI
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [filterByCountry, setFilterByCountry] = useState<string>("all");
  const [filterByStatus, setFilterByStatus] = useState<string>("all");

  // Get sort parameters from URL or use defaults
  const [sortField, setSortField] = useState<SortField>(() => {
    const urlSortField = searchParams.get("sortField") as SortField;
    return urlSortField || "name";
  });
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    const urlSortOrder = searchParams.get("sortOrder") as SortOrder;
    return urlSortOrder || "asc";
  });

  // Initialize filters from URL
  useEffect(() => {
    const urlCountry = searchParams.get("country") || "all";
    const urlStatus = searchParams.get("status") || "all";
    setFilterByCountry(urlCountry);
    setFilterByStatus(urlStatus);
  }, [searchParams]);

  // Custom hooks - called at component level
  const {
    handleSort: handleURLSort,
    handleLeadClick,
    handlePanelClose,
    handleCountryFilterChange: handleURLCountryChange,
    handleStatusFilterChange: handleURLStatusChange,
    handleNavigation,
  } = useLeadsURLManagement();

  // Lead selection effect
  useEffect(() => {
    const leadId = searchParams.get("lead");
    if (leadId && leads.length > 0) {
      const lead = leads.find((l) => l._id === leadId);
      if (lead) {
        setSelectedLead(lead);
        setIsPanelOpen(true);
      } else {
        setIsPanelOpen(false);
        setSelectedLead(null);
      }
    } else {
      setIsPanelOpen(false);
      setSelectedLead(null);
    }
  }, [leads, searchParams]);

  // Lead update handler with React Query mutation
  const handleLeadUpdated = useCallback(
    async (updatedLead: Lead) => {
      try {
        await updateLead(updatedLead);

        // Update local selected lead state
        if (selectedLead?._id === updatedLead._id) {
          setSelectedLead(updatedLead);
        }

        return true;
      } catch (error) {
        console.error("Failed to update lead:", error);
        return false;
      }
    },
    [updateLead, selectedLead?._id]
  );

  // Sort handler - Fixed to provide all required arguments
  const handleSort = useCallback(
    (field: SortField) => {
      const { newField, newOrder } = handleURLSort(field, sortField, sortOrder);
      setSortField(newField);
      setSortOrder(newOrder);
    },
    [handleURLSort, sortField, sortOrder]
  );

  // Country filter handler
  const handleCountryFilterChange = useCallback(
    (country: string) => {
      setFilterByCountry(country);
      handleURLCountryChange(country);
    },
    [handleURLCountryChange]
  );

  // Status filter handler
  const handleStatusFilterChange = useCallback(
    (status: string) => {
      setFilterByStatus(status);
      handleURLStatusChange(status);
    },
    [handleURLStatusChange]
  );

  // Auth check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  // Loading states - Only show loading on first load, not on navigation back
  const isDataReady = !isLoading || leads.length > 0;
  const shouldShowLoading = isLoading && leads.length === 0;

  if (status === "loading") {
    return <LoadingSpinner />;
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">
            Failed to load leads: {error?.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <SubscriptionGuard
      subscriptionLoading={subscriptionLoading}
      hasActiveSubscription={hasActiveSubscription}
      subscriptionData={subscriptionData || null}
    >
      <div className="flex flex-col h-full bg-background dark:bg-gray-800 border-1 rounded-lg">
        {/* RefetchIndicator positioned like all-leads */}
        <RefetchIndicator />

        <URLStateManager>
          <FilterLogic
            leads={leads}
            filterByCountry={filterByCountry}
            filterByStatus={filterByStatus}
            sortField={sortField}
            sortOrder={sortOrder}
            isDataReady={isDataReady}
            searchQuery={searchQuery}
          >
            {({
              filteredLeads,
              sortedLeads,
              availableCountries,
              availableStatuses,
            }) => {
              return (
                <UserLeadsMainContent
                  loading={isFetching && !isDataReady}
                  isDataReady={isDataReady}
                  filteredLeads={filteredLeads}
                  sortedLeads={sortedLeads}
                  availableCountries={availableCountries}
                  availableStatuses={availableStatuses}
                  selectedLead={selectedLead}
                  isPanelOpen={isPanelOpen}
                  filterByCountry={filterByCountry}
                  filterByStatus={filterByStatus}
                  sortField={sortField}
                  sortOrder={sortOrder}
                  shouldShowLoading={shouldShowLoading}
                  showHeader={showHeader}
                  showControls={showControls}
                  currentIndex={
                    selectedLead && isDataReady
                      ? sortedLeads.findIndex(
                          (lead) => lead._id === selectedLead._id
                        )
                      : -1
                  }
                  totalLeads={leads.length}
                  handleCountryFilterChange={handleCountryFilterChange}
                  handleStatusFilterChange={handleStatusFilterChange}
                  handleLeadClick={handleLeadClick}
                  handleSort={handleSort}
                  handlePanelClose={handlePanelClose}
                  handleLeadUpdated={handleLeadUpdated}
                  handleNavigation={handleNavigation}
                />
              );
            }}
          </FilterLogic>
        </URLStateManager>
      </div>
    </SubscriptionGuard>
  );
}

interface UserLeadsMainContentProps {
  loading: boolean;
  isDataReady: boolean;
  filteredLeads: Lead[];
  sortedLeads: Lead[];
  availableCountries: string[];
  availableStatuses: string[];
  selectedLead: Lead | null;
  isPanelOpen: boolean;
  filterByCountry: string;
  filterByStatus: string;
  sortField: SortField;
  sortOrder: SortOrder;
  shouldShowLoading: boolean;
  showHeader: boolean;
  showControls: boolean;
  currentIndex: number;
  totalLeads: number;
  handleCountryFilterChange: (country: string) => void;
  handleStatusFilterChange: (status: string) => void;
  handleLeadClick: (lead: Lead) => void;
  handleSort: (field: SortField) => void;
  handlePanelClose: () => void;
  handleLeadUpdated: (lead: Lead) => Promise<boolean>;
  handleNavigation: (
    direction: "prev" | "next",
    selectedLead: Lead,
    sortedLeads: Lead[]
  ) => void;
}

const UserLeadsMainContent: React.FC<UserLeadsMainContentProps> = ({
  loading,
  isDataReady,
  filteredLeads,
  sortedLeads,
  availableCountries,
  availableStatuses,
  selectedLead,
  isPanelOpen,
  filterByCountry,
  filterByStatus,
  sortField,
  sortOrder,
  shouldShowLoading,
  showHeader,
  showControls,
  currentIndex,
  totalLeads,
  handleCountryFilterChange,
  handleStatusFilterChange,
  handleLeadClick,
  handleSort,
  handlePanelClose,
  handleLeadUpdated,
  handleNavigation,
}) => {
  // Use the updated pagination hook with URL sync
  const {
    pageSize,
    pageIndex,
    paginatedLeads,
    totalPages,
    handlePageSizeChange,
    handlePageChange,
  } = usePagination(sortedLeads);

  // Calculate counts with proper typing
  const counts: CountsData = isDataReady
    ? {
        total: totalLeads,
        filtered: filteredLeads.length,
        currentPage: paginatedLeads.length,
        totalPages,
        countries: availableCountries.length,
        statuses: availableStatuses.length,
      }
    : {
        total: 0,
        filtered: 0,
        currentPage: 0,
        totalPages: 0,
        countries: 0,
        statuses: 0,
      };

  return (
    <div className="flex flex-col h-full bg-background dark:bg-gray-800 border-1 rounded-lg">
      {/* Conditionally render header with smooth fade transition */}
      <div
        className={`transition-opacity duration-300 ease-in-out px-8 mt-4 ${
          showHeader ? "opacity-100" : "opacity-0 pointer-events-none mt-10"
        }`}
        style={{
          marginBottom: showHeader ? "0" : "-100px",
          transition:
            "opacity 300ms ease-in-out, margin-bottom 300ms ease-in-out",
        }}
      >
        <UserLeadsHeader
          shouldShowLoading={shouldShowLoading}
          counts={counts}
        />
      </div>

      {/* Conditionally render filter controls with smooth fade transition */}
      <div
        className={`transition-opacity duration-300 ease-in-out px-8 py-6 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{
          marginBottom: showControls ? "0" : "-80px",
          transition:
            "opacity 300ms ease-in-out, margin-bottom 300ms ease-in-out",
        }}
      >
        <UserLeadsFilterControls
          shouldShowLoading={shouldShowLoading}
          filterByCountry={filterByCountry}
          filterByStatus={filterByStatus}
          onCountryFilterChange={handleCountryFilterChange}
          onStatusFilterChange={handleStatusFilterChange}
          availableCountries={availableCountries}
          availableStatuses={availableStatuses}
          counts={counts}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-auto px-8 pb-4">
        {shouldShowLoading ? (
          <TableSkeleton />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-2">
            <UserLeadsTableContainer
              loading={loading}
              paginatedLeads={paginatedLeads}
              pageSize={pageSize}
              pageIndex={pageIndex}
              totalEntries={counts.filtered}
              totalPages={totalPages}
              selectedLead={selectedLead}
              sortField={sortField}
              sortOrder={sortOrder}
              onLeadClick={handleLeadClick}
              onSort={handleSort}
              onPageSizeChange={handlePageSizeChange}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      {/* Lead Details Panel */}
      {isPanelOpen && selectedLead && isDataReady && (
        <LeadDetailsPanel
          lead={selectedLead}
          isOpen={isPanelOpen}
          onClose={handlePanelClose}
          onLeadUpdated={handleLeadUpdated}
          onNavigate={(direction) =>
            handleNavigation(direction, selectedLead, sortedLeads)
          }
          hasPrevious={currentIndex > 0}
          hasNext={currentIndex < sortedLeads.length - 1}
        />
      )}
    </div>
  );
};
