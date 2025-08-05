// src/hooks/useLeadsPagination.ts
import { useState, useCallback } from "react";
import { Lead } from "@/types/leads";

const DEFAULT_PAGE_SIZE = 10;

export const useLeadsPagination = (filteredLeads: Lead[]) => {
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(0);

  const handlePageSizeChange = useCallback((value: string) => {
    setPageSize(parseInt(value));
    setPageIndex(0);
  }, []);

  const handlePageChange = useCallback((newPageIndex: number) => {
    setPageIndex(newPageIndex);
  }, []);

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

  return {
    pageSize,
    pageIndex,
    paginatedLeads,
    totalPages,
    handlePageSizeChange,
    handlePageChange,
  };
};
