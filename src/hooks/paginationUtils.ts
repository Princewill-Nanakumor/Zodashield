// src/hooks/paginationUtils.ts
import { useState, useCallback, useEffect } from "react";
import { Lead } from "@/types/leads";

const DEFAULT_PAGE_SIZE = 10;

interface PaginationResult {
  pageSize: number;
  pageIndex: number;
  paginatedLeads: Lead[];
  totalPages: number;
  handlePageSizeChange: (value: string) => void;
  handlePageChange: (newPageIndex: number) => void;
}

export const usePagination = (filteredLeads: Lead[]): PaginationResult => {
  // Pure local pagination state (no router / URL coupling)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(0);

  const handlePageSizeChange = useCallback(
    (value: string) => {
      const newPageSize = parseInt(value);
      const newPageIndex = 0; // Reset to first page when changing page size

      setPageSize(newPageSize);
      setPageIndex(newPageIndex);
    },
    []
  );

  const handlePageChange = useCallback(
    (newPageIndex: number) => {
      setPageIndex(newPageIndex);
    },
    []
  );

  // Calculate paginated leads
  const paginatedLeads = (() => {
    if (filteredLeads.length === 0) return [];

    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;

    // Reset page if current page is out of bounds
    if (startIndex >= filteredLeads.length && pageIndex > 0) {
      const newPageIndex = Math.floor((filteredLeads.length - 1) / pageSize);
      setPageIndex(newPageIndex);
      return filteredLeads.slice(
        newPageIndex * pageSize,
        (newPageIndex + 1) * pageSize
      );
    }

    return filteredLeads.slice(startIndex, endIndex);
  })();

  const totalPages = Math.ceil(filteredLeads.length / pageSize);

  // Auto-reset page if it's beyond the available pages
  useEffect(() => {
    if (pageIndex >= totalPages && totalPages > 0 && pageIndex > 0) {
      const newPageIndex = totalPages - 1;
      setPageIndex(newPageIndex);
    }
  }, [pageIndex, totalPages, pageSize]);

  return {
    pageSize,
    pageIndex,
    paginatedLeads,
    totalPages,
    handlePageSizeChange,
    handlePageChange,
  };
};
