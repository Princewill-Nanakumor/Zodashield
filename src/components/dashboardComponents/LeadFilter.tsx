// src/components/dashboardComponents/LeadsFilter.tsx
"use client";

import { useState, Suspense } from "react";
import { FilterControls } from "@/components/dashboardComponents/FilterControls";
import { BulkActions } from "@/components/dashboardComponents/BulkActions";
import { Lead } from "@/types/leads";
import { User } from "@/types/user.types";
import { Loader2 } from "lucide-react";

// Enhanced Filter Skeleton Component
const FilterSkeleton = () => (
  <div className="flex items-center gap-3">
    {/* Add Status Button Skeleton */}
    <div className="w-[120px] h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />

    {/* User Filter Skeleton */}
    <div className="w-[200px] h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />

    {/* Status Filter Skeleton */}
    <div className="w-[180px] h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />

    {/* Country Filter Skeleton */}
    <div className="w-[180px] h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
  </div>
);

// Individual Filter Skeleton Component
const SingleFilterSkeleton = () => (
  <div className="w-[180px] h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
);

const ErrorBoundary = ({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) return <>{fallback}</>;

  try {
    return <>{children}</>;
  } catch {
    setHasError(true);
    return <>{fallback}</>;
  }
};

// Standardized Filter Component with improved loading behavior
const FilterSelect = ({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  isLoading,
  isInitializing,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled: boolean;
  isLoading: boolean;
  isInitializing: boolean;
}) => {
  // Show skeleton during initialization
  if (isInitializing) {
    return <SingleFilterSkeleton />;
  }

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || isLoading}
        className="w-[180px] h-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {isLoading ? (
          <option value="" disabled>
            Loading...
          </option>
        ) : (
          <>
            <option value="all">{placeholder}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </>
        )}
      </select>

      {/* Loading spinner overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 rounded-md">
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        </div>
      )}
    </div>
  );
};

// Country Filter Component
const CountryFilter = ({
  value,
  onChange,
  countries,
  disabled,
  isLoading,
  isInitializing,
}: {
  value: string;
  onChange: (value: string) => void;
  countries: string[];
  disabled: boolean;
  isLoading: boolean;
  isInitializing: boolean;
}) => {
  const options = countries.map((country) => ({
    value: country,
    label: country.charAt(0).toUpperCase() + country.slice(1),
  }));

  return (
    <FilterSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder="All Countries"
      disabled={disabled}
      isLoading={isLoading}
      isInitializing={isInitializing}
    />
  );
};

// Status Filter Component
const StatusFilter = ({
  value,
  onChange,
  statuses,
  disabled,
  isLoading,
  isInitializing,
}: {
  value: string;
  onChange: (value: string) => void;
  statuses: string[];
  disabled: boolean;
  isLoading: boolean;
  isInitializing: boolean;
}) => {
  // Add "NEW" as a default status if it's not already in the list
  const allStatuses = statuses.includes("NEW")
    ? statuses
    : ["NEW", ...statuses];

  const options = allStatuses.map((status) => ({
    value: status,
    label:
      status === "NEW"
        ? "New"
        : status.charAt(0).toUpperCase() + status.slice(1),
  }));

  return (
    <FilterSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder="All Statuses"
      disabled={disabled}
      isLoading={isLoading}
      isInitializing={isInitializing}
    />
  );
};

const BulkActionsSkeleton = () => (
  <div className="flex items-center gap-3">
    <div className="w-[100px] h-8 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
    <div className="w-[120px] h-8 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
  </div>
);

interface LeadsFilterControlsProps {
  selectedLeads: Lead[];
  hasAssignedLeads: boolean;
  assignedLeadsCount: number;
  isUpdating: boolean;
  onAssign: () => void;
  onUnassign: () => void;
  filterByCountry: string;
  onCountryFilterChange: (country: string) => void;
  filterByStatus: string;
  onStatusFilterChange: (status: string) => void;
  availableCountries: string[];
  availableStatuses: string[];
  isLoading: boolean;
  filterByUser: string;
  onFilterChange: (value: string) => void;
  users: User[];
  isLoadingUsers: boolean;
  isInitializing?: boolean;
}

export const LeadsFilterControls: React.FC<LeadsFilterControlsProps> = ({
  selectedLeads,
  hasAssignedLeads,
  assignedLeadsCount,
  isUpdating,
  onAssign,
  onUnassign,
  filterByCountry,
  onCountryFilterChange,
  filterByStatus,
  onStatusFilterChange,
  availableCountries,
  availableStatuses,
  isLoading,
  filterByUser,
  onFilterChange,
  users,
  isLoadingUsers,
  isInitializing = false,
}) => {
  // Show full skeleton during initialization
  if (isInitializing) {
    return (
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 px-8 py-4 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <BulkActionsSkeleton />
          <FilterSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 px-8 py-4 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ErrorBoundary
            fallback={
              <div className="text-red-500">Bulk actions failed to load</div>
            }
          >
            <BulkActions
              selectedLeads={selectedLeads}
              hasAssignedLeads={hasAssignedLeads}
              assignedLeadsCount={assignedLeadsCount}
              isUpdating={isUpdating}
              onAssign={onAssign}
              onUnassign={onUnassign}
            />
          </ErrorBoundary>
        </div>

        <div className="flex items-center gap-3">
          <ErrorBoundary fallback={<FilterSkeleton />}>
            <Suspense fallback={<FilterSkeleton />}>
              <FilterControls
                filterByUser={filterByUser}
                onFilterChange={onFilterChange}
                users={users}
                isLoading={isLoadingUsers}
                isInitializing={isInitializing}
              />
              {/* Status Filter */}
              <StatusFilter
                value={filterByStatus}
                onChange={onStatusFilterChange}
                statuses={availableStatuses}
                disabled={isLoading}
                isLoading={isLoadingUsers}
                isInitializing={isInitializing}
              />
              {/* Country Filter */}
              <CountryFilter
                value={filterByCountry}
                onChange={onCountryFilterChange}
                countries={availableCountries}
                disabled={isLoading}
                isLoading={isLoadingUsers}
                isInitializing={isInitializing}
              />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};
