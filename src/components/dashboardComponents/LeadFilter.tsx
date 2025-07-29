// src/components/dashboardComponents/LeadsFilter.tsx
"use client";

import { useState, Suspense } from "react";
import { FilterControls } from "@/components/dashboardComponents/FilterControls";
import { BulkActions } from "@/components/dashboardComponents/BulkActions";
import { Lead } from "@/types/leads";
import { User } from "@/types/user.types";

const FilterSkeleton = () => (
  <div className="flex items-center gap-3 animate-pulse">
    <div className="w-[180px] h-10 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
    <div className="w-[200px] h-10 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
    <div className="w-[180px] h-10 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
  </div>
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

// Simple Country Filter Component
const CountryFilter = ({
  value,
  onChange,
  countries,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  countries: string[];
  disabled: boolean;
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    className="w-[180px] h-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
  >
    <option value="all">All Countries</option>
    {countries.map((country) => (
      <option key={country} value={country}>
        {country.charAt(0).toUpperCase() + country.slice(1)}
      </option>
    ))}
  </select>
);

// Simple Status Filter Component
const StatusFilter = ({
  value,
  onChange,
  statuses,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  statuses: string[];
  disabled: boolean;
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    className="w-[180px] h-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
  >
    <option value="all">All Statuses</option>
    {statuses.map((status) => (
      <option key={status} value={status}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </option>
    ))}
  </select>
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
}) => {
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
              {/* Simple Country Filter */}
              <CountryFilter
                value={filterByCountry}
                onChange={onCountryFilterChange}
                countries={availableCountries}
                disabled={isLoading}
              />

              {/* Simple Status Filter */}
              <StatusFilter
                value={filterByStatus}
                onChange={onStatusFilterChange}
                statuses={availableStatuses}
                disabled={isLoading}
              />

              {/* Simple User Filter */}
              <FilterControls
                filterByUser={filterByUser}
                onFilterChange={onFilterChange}
                users={users}
                isLoading={isLoadingUsers}
              />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
};
