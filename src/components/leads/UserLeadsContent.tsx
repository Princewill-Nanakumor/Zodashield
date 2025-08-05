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

type SortField = "name" | "country" | "status" | "source" | "createdAt";
type SortOrder = "asc" | "desc";

export default function UserLeadsContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [filterByCountry, setFilterByCountry] = useState<string>("all");
  const [filterByStatus, setFilterByStatus] = useState<string>("all"); // Add status filter

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
            filterByStatus={filterByStatus} // Add this
            sortField={sortField}
            sortOrder={sortOrder}
            isDataReady={isDataReady}
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
                  availableStatuses={availableStatuses} // Add this
                  selectedLead={selectedLead}
                  isPanelOpen={isPanelOpen}
                  filterByCountry={filterByCountry}
                  filterByStatus={filterByStatus} // Add this
                  sortField={sortField}
                  sortOrder={sortOrder}
                  shouldShowLoading={loading && leads.length === 0}
                  currentIndex={
                    selectedLead && isDataReady
                      ? leads.findIndex((lead) => lead._id === selectedLead._id)
                      : -1
                  }
                  totalLeads={leads.length}
                  handleCountryFilterChange={handleCountryFilterChange}
                  handleStatusFilterChange={handleStatusFilterChange} // Add this
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

// Update the interface to include status filtering
interface UserLeadsMainContentProps {
  loading: boolean;
  isDataReady: boolean;
  filteredLeads: Lead[];
  sortedLeads: Lead[];
  availableCountries: string[];
  availableStatuses: string[]; // Add this
  selectedLead: Lead | null;
  isPanelOpen: boolean;
  filterByCountry: string;
  filterByStatus: string; // Add this
  sortField: SortField;
  sortOrder: SortOrder;
  shouldShowLoading: boolean;
  currentIndex: number;
  totalLeads: number;
  handleCountryFilterChange: (country: string) => void;
  handleStatusFilterChange: (status: string) => void; // Add this
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
  availableStatuses, // Add this
  selectedLead,
  isPanelOpen,
  filterByCountry,
  filterByStatus, // Add this
  sortField,
  sortOrder,
  shouldShowLoading,
  currentIndex,
  totalLeads,
  handleCountryFilterChange,
  handleStatusFilterChange, // Add this
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
        countries: 0,
        statuses: 0,
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
    <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border-1">
      <UserLeadsHeader shouldShowLoading={shouldShowLoading} counts={counts} />

      <UserLeadsFilterControls
        shouldShowLoading={shouldShowLoading}
        filterByCountry={filterByCountry}
        filterByStatus={filterByStatus} // Add this
        onCountryFilterChange={handleCountryFilterChange}
        onStatusFilterChange={handleStatusFilterChange} // Add this
        availableCountries={availableCountries}
        availableStatuses={availableStatuses} // Add this
        counts={counts}
      />

      {shouldShowLoading ? (
        <TableSkeleton />
      ) : (
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
      )}

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
