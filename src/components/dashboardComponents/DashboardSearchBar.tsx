// /Users/safeconnection/Downloads/drivecrm-main/src/components/dashboardComponents/DashboardSearchBar.tsx

"use client";

import React, { useState, useEffect, useCallback } from "react";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

interface DashboardSearchBarProps {
  onSearch: (query: string) => void;
  searchQuery?: string; // Add this prop
  isLoading?: boolean;
  placeholder?: string;
}

// Update DashboardSearchBar.tsx to add debug logging:

export const DashboardSearchBar: React.FC<DashboardSearchBarProps> = ({
  onSearch,
  searchQuery = "",
  isLoading = false,
  placeholder = "Search leads by name, email, or phone...",
}) => {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const debouncedSearchQuery = useDebounce(localSearchQuery, 300);

  // Sync with external searchQuery prop
  useEffect(() => {
    console.log(
      "DashboardSearchBar: External searchQuery changed to:",
      searchQuery
    );
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    console.log(
      "DashboardSearchBar: Debounced search query changed to:",
      debouncedSearchQuery
    );
    onSearch(debouncedSearchQuery.trim());
  }, [debouncedSearchQuery, onSearch]);

  const handleClear = useCallback(() => {
    console.log("DashboardSearchBar: Clearing search");
    setLocalSearchQuery("");
    onSearch("");
  }, [onSearch]);

  return (
    <div className="relative w-full max-w-xs">
      <input
        type="text"
        value={localSearchQuery}
        onChange={(e) => {
          console.log("DashboardSearchBar: Input changed to:", e.target.value);
          setLocalSearchQuery(e.target.value);
        }}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        disabled={isLoading}
      />
      {/* Search icon */}
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      {/* Clear button */}
      {localSearchQuery && !isLoading && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};
