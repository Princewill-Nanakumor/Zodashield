// src/hooks/paginationUtils.ts
import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize from URL parameters
  const [pageSize, setPageSize] = useState(() => {
    const urlPageSize = searchParams.get("pageSize");
    return urlPageSize ? parseInt(urlPageSize) : DEFAULT_PAGE_SIZE;
  });

  const [pageIndex, setPageIndex] = useState(() => {
    const urlPageIndex = searchParams.get("page");
    return urlPageIndex ? parseInt(urlPageIndex) : 0;
  });

  // Sync with URL when search params change
  useEffect(() => {
    const urlPageSize = searchParams.get("pageSize");
    const urlPageIndex = searchParams.get("page");

    if (urlPageSize && parseInt(urlPageSize) !== pageSize) {
      setPageSize(parseInt(urlPageSize));
    }

    if (urlPageIndex && parseInt(urlPageIndex) !== pageIndex) {
      setPageIndex(parseInt(urlPageIndex));
    }
  }, [searchParams, pageSize, pageIndex]);

  // Update URL when pagination changes
  const updateURL = useCallback(
    (newPageIndex: number, newPageSize: number) => {
      const params = new URLSearchParams(searchParams);

      if (newPageIndex > 0) {
        params.set("page", newPageIndex.toString());
      } else {
        params.delete("page");
      }

      if (newPageSize !== DEFAULT_PAGE_SIZE) {
        params.set("pageSize", newPageSize.toString());
      } else {
        params.delete("pageSize");
      }

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  const handlePageSizeChange = useCallback(
    (value: string) => {
      const newPageSize = parseInt(value);
      const newPageIndex = 0; // Reset to first page when changing page size

      setPageSize(newPageSize);
      setPageIndex(newPageIndex);
      updateURL(newPageIndex, newPageSize);
    },
    [updateURL]
  );

  const handlePageChange = useCallback(
    (newPageIndex: number) => {
      setPageIndex(newPageIndex);
      updateURL(newPageIndex, pageSize);
    },
    [updateURL, pageSize]
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
      updateURL(newPageIndex, pageSize);
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
      updateURL(newPageIndex, pageSize);
    }
  }, [pageIndex, totalPages, pageSize, updateURL]);

  return {
    pageSize,
    pageIndex,
    paginatedLeads,
    totalPages,
    handlePageSizeChange,
    handlePageChange,
  };
};
