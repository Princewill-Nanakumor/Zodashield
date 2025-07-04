// src/app/components/dashboardComponents/LeadsTable.tsx
"use client";

import { useMemo } from "react";
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
  usePageSize,
  usePageIndex,
  useSorting,
  useSetPageSize,
  useSetPageIndex,
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
}

export default function LeadsTable({
  leads = [],
  onLeadUpdated,
  isLoading = false,
  users = [],
  selectedLeads = [],
  onSelectionChange,
}: LeadsTableProps) {
  // Store hooks
  const selectedLead = useSelectedLead();
  const setSelectedLead = useSetSelectedLead();
  const setIsPanelOpen = useSetIsPanelOpen();
  const pageSize = usePageSize();
  const pageIndex = usePageIndex();
  const sorting = useSorting();
  const setPageSize = useSetPageSize();
  const setPageIndex = useSetPageIndex();
  const setSorting = useSetSorting();
  const storeSelectedLeads = useSelectedLeads();
  const setStoreSelectedLeads = useSetSelectedLeads();

  // Use props selectedLeads if provided, otherwise use store
  const displaySelectedLeads =
    selectedLeads.length > 0 ? selectedLeads : storeSelectedLeads;

  // Custom hooks
  const { sortedLeads, handleSort } = useTableSorting({
    leads,
    sortField: (sorting[0]?.id as SortField) || "name",
    sortOrder: sorting[0]?.desc ? "desc" : "asc",
    users,
    onSortChange: (field, order) => {
      setSorting([{ id: field, desc: order === "desc" }]);
    },
  });

  // Memoized current page leads with page preservation logic
  const currentPageLeads = useMemo(() => {
    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;

    // If the current page would be empty after filtering, adjust to the last valid page
    if (startIndex >= sortedLeads.length && sortedLeads.length > 0) {
      const newPageIndex = Math.floor((sortedLeads.length - 1) / pageSize);
      // Only update if the page actually changed
      if (newPageIndex !== pageIndex) {
        setPageIndex(newPageIndex);
        return sortedLeads.slice(
          newPageIndex * pageSize,
          (newPageIndex + 1) * pageSize
        );
      }
    }

    return sortedLeads.slice(startIndex, endIndex);
  }, [sortedLeads, pageIndex, pageSize, setPageIndex]);

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
    sortField: (sorting[0]?.id as SortField) || "name",
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
    sorting,
    rowSelection,
    setSorting,
    setPageIndex,
    setPageSize,
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
            <tbody>
              <tr>
                <td colSpan={columns.length}>
                  <EmptyStateAdminLeadsTable />
                </td>
              </tr>
            </tbody>
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
          onPageChange={setPageIndex}
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
