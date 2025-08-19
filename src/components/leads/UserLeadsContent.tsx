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
import { LeadDataManager } from "@/components/user-leads/LeadDataManager";
import { FilterLogic } from "@/components/user-leads/FilterLogic";
import { URLStateManager } from "../user-leads/URLStatemanager";
import { SubscriptionGuard } from "@/components/user-leads/SubscriptionGuard";
import { UserLeadsTableContainer } from "@/components/user-leads/UserLeadsTableContainer";
import { useSubscriptionCheck } from "@/hooks/useSubscriptionCheck";
import { useLeadsURLManagement } from "@/hooks/useLeadsURLManagement";
import { usePagination } from "@/hooks/paginationUtils";
import { useSearchContext } from "@/context/SearchContext";
import { useToggleContext } from "@/context/ToggleContext";

type SortField = "name" | "country" | "status" | "source" | "createdAt";
type SortOrder = "asc" | "desc";

export default function UserLeadsContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { searchQuery } = useSearchContext(); // Get search from context
  const toggleContext = useToggleContext(); // Get toggle state from context

  // Use toggle context if available, otherwise default values
  const showHeader = toggleContext?.showHeader ?? true;
  const showControls = toggleContext?.showControls ?? true;

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
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
  const { subscriptionLoading, hasActiveSubscription, subscriptionData } =
    useSubscriptionCheck(status);
  const {
    handleSort: handleURLSort,
    handleLeadClick,
    handlePanelClose,
    handleCountryFilterChange: handleURLCountryChange,
    handleStatusFilterChange: handleURLStatusChange,
    handleNavigation,
  } = useLeadsURLManagement();

  // Set data ready state when initial load completes
  useEffect(() => {
    setIsDataReady(!loading);
  }, [loading]);

  // Lead selection effect
  useEffect(() => {
    const leadId = searchParams.get("lead");
    if (leadId && isDataReady) {
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
  }, [leads, searchParams, isDataReady]);

  // Lead update handler
  const handleLeadUpdated = useCallback(
    async (updatedLead: Lead) => {
      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead._id === updatedLead._id ? updatedLead : lead
        )
      );

      if (selectedLead?._id === updatedLead._id) {
        setSelectedLead(updatedLead);
      }

      return true;
    },
    [selectedLead?._id]
  );

  // Sort handler
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

  if (status === "loading") {
    return <LoadingSpinner />;
  }

  return (
    <SubscriptionGuard
      subscriptionLoading={subscriptionLoading}
      hasActiveSubscription={hasActiveSubscription}
      subscriptionData={subscriptionData}
    >
      <LeadDataManager onLeadsLoaded={setLeads} onLoadingChange={setLoading}>
        <URLStateManager>
          <FilterLogic
            leads={leads}
            filterByCountry={filterByCountry}
            filterByStatus={filterByStatus}
            sortField={sortField}
            sortOrder={sortOrder}
            isDataReady={isDataReady}
            searchQuery={searchQuery} // Pass search query to filter logic
          >
            {({
              filteredLeads,
              sortedLeads,
              availableCountries,
              availableStatuses,
            }) => {
              return (
                <UserLeadsMainContent
                  loading={loading}
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
                  shouldShowLoading={loading && leads.length === 0}
                  showHeader={showHeader} // Pass toggle props
                  showControls={showControls} // Pass toggle props
                  currentIndex={
                    selectedLead && isDataReady
                      ? leads.findIndex((lead) => lead._id === selectedLead._id)
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
      </LeadDataManager>
    </SubscriptionGuard>
  );
}

// Update the interface to include toggle props
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
  showHeader: boolean; // Add toggle props
  showControls: boolean; // Add toggle props
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
  showHeader, // Add toggle props
  showControls, // Add toggle props
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
  // NOW we can safely use the pagination hook here
  const {
    pageSize,
    pageIndex,
    paginatedLeads,
    totalPages,
    handlePageSizeChange,
    handlePageChange,
  } = usePagination(filteredLeads);

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
          marginBottom: showControls ? "0" : "-80px", // Smooth height transition
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
