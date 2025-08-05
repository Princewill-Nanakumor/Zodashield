// src/components/leads/UserLeadsFilterControls.tsx
"use client";

import React from "react";
import { CountsData } from "@/types/pagination.types";

import { FilterSelect } from "../dashboardComponents/leadsFilters/FilterSelect";
import { StatusFilter } from "../dashboardComponents/leadsFilters/StatusFilter";

interface UserLeadsFilterControlsProps {
  shouldShowLoading: boolean;
  filterByCountry: string;
  filterByStatus: string;
  onCountryFilterChange: (country: string) => void;
  onStatusFilterChange: (status: string) => void;
  availableCountries: string[];
  availableStatuses: string[]; // Keep this for backward compatibility but won't use it
  counts: CountsData;
}

const FilterSkeleton = () => (
  <div className="flex items-center gap-3">
    <div className="w-[180px] h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
    <div className="w-[180px] h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
  </div>
);

export const UserLeadsFilterControls: React.FC<
  UserLeadsFilterControlsProps
> = ({
  shouldShowLoading,
  filterByCountry,
  filterByStatus,
  onCountryFilterChange,
  onStatusFilterChange,
  availableCountries,

  counts,
}) => {
  // Add safety checks and default values
  const safeFilterByCountry = filterByCountry || "all";
  const safeAvailableCountries = availableCountries || [];

  if (shouldShowLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <FilterSkeleton />
          <div className="w-48 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Create country options
  const countryOptions = [
    { value: "all", label: "All Countries" },
    ...safeAvailableCountries.map((country) => ({
      value: country,
      label: country,
    })),
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filters:
          </span>

          {/* Country Filter */}
          <FilterSelect
            value={safeFilterByCountry}
            onChange={onCountryFilterChange}
            options={countryOptions}
            placeholder="All Countries"
            disabled={shouldShowLoading}
            isLoading={false}
          />

          {/* Status Filter - Use the same component as ADMIN */}
          <StatusFilter
            value={filterByStatus}
            onChange={onStatusFilterChange}
            disabled={shouldShowLoading}
          />
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {counts?.filtered || 0} of {counts?.total || 0} leads
          {(filterByCountry !== "all" || filterByStatus !== "all") &&
            " (filtered)"}
        </div>
      </div>
    </div>
  );
};
