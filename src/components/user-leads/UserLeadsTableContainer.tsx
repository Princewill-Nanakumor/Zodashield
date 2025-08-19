// src/components/user-leads/UserLeadsTableContainer.tsx
import React from "react";
import { Lead } from "@/types/leads";
import { UserLeadTable } from "@/components/user-leads/UserLeadTable";
import UserLeadTableControls from "./UserLeadTableControls";
import { TablePagination } from "@/components/leads/TablePagination";

type SortField = "name" | "country" | "status" | "source" | "createdAt";
type SortOrder = "asc" | "desc";

interface UserLeadsTableContainerProps {
  loading: boolean;
  paginatedLeads: Lead[];
  pageSize: number;
  pageIndex: number;
  totalEntries: number;
  totalPages: number;
  selectedLead: Lead | null;
  sortField: SortField;
  sortOrder: SortOrder;
  onLeadClick: (lead: Lead) => void;
  onSort: (field: SortField) => void;
  onPageSizeChange: (value: string) => void;
  onPageChange: (newPageIndex: number) => void;
}

export const UserLeadsTableContainer: React.FC<
  UserLeadsTableContainerProps
> = ({
  loading,
  paginatedLeads,
  pageSize,
  pageIndex,
  totalEntries,
  totalPages,
  selectedLead,
  sortField,
  sortOrder,
  onLeadClick,
  onSort,
  onPageSizeChange,
  onPageChange,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <UserLeadTableControls
        pageSize={pageSize}
        pageIndex={pageIndex}
        totalEntries={totalEntries}
        onPageSizeChange={onPageSizeChange}
      />

      <UserLeadTable
        loading={loading}
        paginatedLeads={paginatedLeads}
        onLeadClick={onLeadClick}
        selectedLead={selectedLead}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={onSort}
      />

      {totalEntries > 0 && (
        <div className="border-t border-gray-200 dark:border-gray-700 mb-4 px-2">
          <TablePagination
            pageIndex={pageIndex}
            pageCount={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};
