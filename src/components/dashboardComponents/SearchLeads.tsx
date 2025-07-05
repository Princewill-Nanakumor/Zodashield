// src/app/components/dashboardComponents/SearchLeads.tsx
"use client";

import React, { useState, useCallback, useEffect } from "react";

// Simple debounce hook inline to avoid import issues
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface SearchLeadsProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export const SearchLeads: React.FC<SearchLeadsProps> = ({
  onSearch,
  onClear,
  isLoading = false,
  placeholder = "Search leads by name or email...",
  className = "",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchQuery(value);

      if (value.trim() === "") {
        onClear();
      }
    },
    [onClear]
  );

  const handleClear = useCallback(() => {
    setSearchQuery("");
    onClear();
  }, [onClear]);

  // Trigger search when debounced query changes - using useEffect instead of useMemo
  useEffect(() => {
    if (debouncedSearchQuery.trim() !== "") {
      onSearch(debouncedSearchQuery.trim());
    }
  }, [debouncedSearchQuery, onSearch]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        {/* Search icon using CSS */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          disabled={isLoading}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        )}
        {searchQuery && !isLoading && (
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
    </div>
  );
};
