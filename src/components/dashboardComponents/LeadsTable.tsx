"use client";

import { useMemo, useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { EmptyStateAdminLeadsTable } from "./EmptyStateAdminLeadsTable";
import LeadDetailsPanel from "@/components/dashboardComponents/LeadDetailsPanel";
import { Lead } from "@/types/leads";
import { User } from "@/types/user.types";
import { TableHeader as CustomTableHeader } from "@/components/leads/LeadsTable/TableHeader";
import { TableContent } from "@/components/leads/TableContent";
import { TablePagination } from "@/components/leads/TablePagination";
import { Table } from "@/components/ui/Table";
import { Loader2 } from "lucide-react";
import {
  useSelectedLead,
  useSetSelectedLead,
  useSetIsPanelOpen,
  useSorting,
  useSetSorting,
  useSelectedLeads,
  useSetSelectedLeads,
} from "@/stores/leadsStore";
import { SortField } from "@/types/table";

import { useTableSorting } from "./TableSorting";
import { useRowSelection } from "./RowSelection";
import { usePanelNavigation } from "./PanelNavigation";
import { useTableColumns } from "./TableColumns";
import { useTableConfiguration } from "./TableConfiguration";

interface LeadsTableProps {
  leads: Lead[];
  onLeadUpdated: (lead: Lead) => Promise<boolean>;
  isLoading?: boolean;
  users: User[];
  selectedLeads?: Lead[];
  onSelectionChange?: (leads: Lead[]) => void;
  searchQuery?: string;
  filterByUser?: string;
  filterByCountry?: string;
}

export default function LeadsTable({
  leads = [],
  onLeadUpdated,
  isLoading = false,
  users = [],
  selectedLeads = [],
  onSelectionChange,
  searchQuery = "",
  filterByUser = "all",
  filterByCountry = "all",
}: LeadsTableProps) {
  // Store hooks (NOT for pagination)
  const selectedLead = useSelectedLead();
  const setSelectedLead = useSetSelectedLead();
  const setIsPanelOpen = useSetIsPanelOpen();
  const sorting = useSorting();
  const setSorting = useSetSorting();
  const storeSelectedLeads = useSelectedLeads();
  const setStoreSelectedLeads = useSetSelectedLeads();
  const isInitializedRef = useRef(false);

  // URL and pagination state (LOCAL ONLY - no store)
  const searchParams = useSearchParams();
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(15); // Local pageSize

  // --- STABILIZED SORTING STATE ---
  const stableSorting = useMemo(() => {
    if (!sorting || sorting.length === 0) {
      return [{ id: "name", desc: false }];
    }
    return sorting;
  }, [sorting]);

  // --- DEBUG LOG: Every render ---
  console.log("LeadsTable render", {
    filterByUser,
    filterByCountry,
    sorting: stableSorting,
    pageIndex,
    pageSize,
    leadsCount: leads.length,
  });

  // Debug log to see what's causing re-renders
  useEffect(() => {
    console.log("LeadsTable re-render triggered:", {
      leadsLength: leads.length,
      leadsIds: leads.slice(0, 3).map((l) => l._id), // First 3 IDs
      pageIndex,
      filterByUser,
      filterByCountry,
      reason: "props changed",
    });
  }, [leads, pageIndex, filterByUser, filterByCountry]);

  // Sync pageIndex with URL on mount ONLY (not on every URL change)
  useEffect(() => {
    if (isInitializedRef.current) return; // Only run once

    const pageParam = searchParams.get("page");
    if (pageParam && !isNaN(Number(pageParam))) {
      const newPageIndex = Number(pageParam) - 1;
      console.log("Initializing pageIndex from URL:", {
        pageParam,
        newPageIndex,
      });
      setPageIndex(newPageIndex);
    }

    isInitializedRef.current = true;
  }, [searchParams]);

  // Preserve page position when leads change
  // Preserve page position when leads change
  // Preserve page position when leads change
  useEffect(() => {
    const currentPage = searchParams.get("page");
    if (currentPage && !isNaN(Number(currentPage))) {
      const targetPage = Number(currentPage) - 1;
      if (pageIndex !== targetPage) {
        console.log("Preserving page position:", {
          from: pageIndex,
          to: targetPage,
          reason: "leads changed",
        });
        setPageIndex(targetPage);
      }
    }
    // Intentionally only depend on leads.length to avoid infinite loops
    // when pageIndex or searchParams change
  }, [leads.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update URL when page changes
  const handlePageChange = useCallback((page: number) => {
    setPageIndex(page);
    const currentPathname = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    params.set("page", String(page + 1));
    window.history.replaceState(
      {},
      "",
      `${currentPathname}?${params.toString()}`
    );
  }, []);

  useEffect(() => {
    console.log("LeadsTable: Received leads:", {
      count: leads.length,
      searchQuery,
      filterByUser,
      filterByCountry,
    });
  }, [leads, searchQuery, filterByUser, filterByCountry]);

  // Use props selectedLeads if provided, otherwise use store
  const displaySelectedLeads =
    selectedLeads.length > 0 ? selectedLeads : storeSelectedLeads;

  // Custom hooks
  const { sortedLeads, handleSort } = useTableSorting({
    leads,
    sortField: (stableSorting[0]?.id as SortField) || "name",
    sortOrder: stableSorting[0]?.desc ? "desc" : "asc",
    users,
    searchQuery,
    onSortChange: useCallback(
      (field, order) => {
        console.log("Sort change triggered:", { field, order });
        setSorting([{ id: field, desc: order === "desc" }]);
        // Remove all page reset logic
      },
      [setSorting]
    ),
  });

  // Memoized current page leads WITHOUT automatic page adjustment
  const currentPageLeads = useMemo(() => {
    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;

    console.log("currentPageLeads calculation:", {
      pageIndex,
      pageSize,
      startIndex,
      endIndex,
      sortedLeadsLength: sortedLeads.length,
      wouldBeEmpty: startIndex >= sortedLeads.length,
    });

    // Don't automatically adjust the page - let the user handle it
    // Just return the leads for the current page, even if it's empty
    return sortedLeads.slice(startIndex, endIndex);
  }, [sortedLeads, pageIndex, pageSize]);

  const {
    rowSelection,
    allSelected,
    selectAllRef,
    handleSelectAll,
    handleRowSelection,
  } = useRowSelection({
    selectedLeads: displaySelectedLeads,
    currentPageLeads,
    onSelectionChange: (leads) => {
      setStoreSelectedLeads(leads);
      onSelectionChange?.(leads);
    },
  });

  const { handleRowClick, handlePanelClose, handleNavigate, currentIndex } =
    usePanelNavigation({
      selectedLead,
      sortedLeads,
      setSelectedLead,
      setIsPanelOpen,
    });

  const { columns } = useTableColumns({
    sortField: (stableSorting[0]?.id as SortField) || "name",
    handleSort,
    allSelected,
    selectedLeads: displaySelectedLeads,
    handleSelectAll,
    handleRowSelection,
    users,
    selectAllRef,
  });

  const { table } = useTableConfiguration({
    data: sortedLeads,
    columns,
    pageSize,
    pageIndex,
    sorting: stableSorting,
    rowSelection,
    setSorting,
    setPageIndex: handlePageChange, // Use the URL-syncing handler
    setPageSize, // Use local setPageSize
  });

  if (isLoading) {
    return (
      <div className="p-4 rounded-lg shadow dark:bg-gray-800 dark:text-white flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  const showEmptyState = sortedLeads.length === 0;

  return (
    <>
      <div className="p-4 rounded-lg shadow dark:bg-gray-800 dark:text-white">
        <CustomTableHeader
          table={table}
          pageSize={pageSize}
          pageIndex={pageIndex}
          totalRows={sortedLeads.length}
        />

        <Table>
          {showEmptyState ? (
            <EmptyStateAdminLeadsTable
              searchQuery={searchQuery}
              filterByUser={filterByUser}
              filterByCountry={filterByCountry}
              hasFilters={filterByUser !== "all" || filterByCountry !== "all"}
              users={users}
            />
          ) : (
            <TableContent
              table={table}
              onRowClick={handleRowClick}
              selectedLead={selectedLead}
            />
          )}
        </Table>

        <TablePagination
          pageIndex={pageIndex}
          pageCount={table.getPageCount()}
          onPageChange={handlePageChange}
        />
      </div>

      {selectedLead && (
        <LeadDetailsPanel
          key={selectedLead._id}
          lead={selectedLead}
          isOpen={true}
          onLeadUpdated={onLeadUpdated}
          onClose={handlePanelClose}
          onNavigate={handleNavigate}
          hasPrevious={currentIndex > 0}
          hasNext={currentIndex < sortedLeads.length - 1}
        />
      )}
    </>
  );
}
