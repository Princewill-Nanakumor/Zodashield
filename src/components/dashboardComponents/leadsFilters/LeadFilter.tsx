// src/components/dashboardComponents/LeadsFilter.tsx
"use client";

import { useState, Suspense, useEffect } from "react";
import { BulkActions } from "@/components/dashboardComponents/BulkActions";
import { UserFilter } from "./UserFilter";
import { StatusFilter } from "./StatusFilter";
import { CountryFilter } from "./CountryFilter";
import { AddStatusButton } from "./AddStatusButton";
import { Lead } from "@/types/leads";
import { User } from "@/types/user.types";

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
  isLoading,
  filterByUser,
  onFilterChange,
  isLoadingUsers,
}) => {
  const [isLocalInitializing, setIsLocalInitializing] = useState(true);

  // Handle local initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLocalInitializing(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Only show full skeleton during initial load (not when returning to page)
  if (isLocalInitializing && (isLoadingUsers || isLoading)) {
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
    <>
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
                {/* Add Status Button */}
                <AddStatusButton disabled={isLoading} />

                {/* User Filter with React Query */}
                <UserFilter
                  value={filterByUser}
                  onChange={onFilterChange}
                  disabled={isLoading}
                />

                {/* Status Filter with React Query */}
                <StatusFilter
                  value={filterByStatus}
                  onChange={onStatusFilterChange}
                  disabled={isLoading}
                />

                {/* Country Filter with React Query */}
                <CountryFilter
                  value={filterByCountry}
                  onChange={onCountryFilterChange}
                  disabled={isLoading}
                />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </>
  );
};
