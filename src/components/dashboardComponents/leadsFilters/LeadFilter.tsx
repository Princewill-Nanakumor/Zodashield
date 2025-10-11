// src/components/dashboardComponents/LeadsFilter.tsx
"use client";

import { useState } from "react";
import { BulkActions } from "@/components/dashboardComponents/BulkActions";
import { UserFilter } from "./UserFilter";
import { StatusFilter } from "./StatusFilter";
import { CountryFilter } from "./CountryFilter";
import { SourceFilter } from "./SourceFilter";
import { AddStatusButton } from "./AddStatusButton";
import { Lead } from "@/types/leads";
import { User } from "@/types/user.types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AddLeadDialog } from "@/components/dashboardComponents/AddLeadDialog";

// ✅ Enhanced Filter Skeleton Component
const FilterSkeleton = () => (
  <div
    className="flex items-center gap-3"
    role="status"
    aria-label="Loading filters"
  >
    {/* Add Lead Button Skeleton */}
    <div className="w-[120px] h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />

    {/* Add Status Button Skeleton */}
    <div className="w-[120px] h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />

    {/* User Filter Skeleton */}
    <div className="w-[180px] h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />

    {/* Status Filter Skeleton */}
    <div className="w-[180px] h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />

    {/* Source Filter Skeleton */}
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
  filterBySource: string;
  onSourceFilterChange: (source: string) => void;
  isLoading: boolean;
  filterByUser: string;
  onFilterChange: (value: string) => void;
  users: User[];
  isLoadingStatuses?: boolean;
  onAddLead?: () => void;
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
  filterBySource,
  onSourceFilterChange,
  isLoading,
  filterByUser,
  onFilterChange,
  isLoadingStatuses = false,
}) => {
  const [isAddLeadDialogOpen, setIsAddLeadDialogOpen] = useState(false);

  // ✅ Combine all loading states for consistent skeleton display
  const showFilterSkeletons = isLoading || isLoadingStatuses;

  return (
    <>
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 px-8 mt-8 pb-5">
        <div className="flex items-center justify-between gap-4 rounded-xl border py-4 px-4">
          <div className="flex items-center gap-3 ">
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
              {/* Add Lead Button - with loading skeleton */}
              {showFilterSkeletons ? (
                <div className="w-[120px] h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
              ) : (
                <Button
                  onClick={() => setIsAddLeadDialogOpen(true)}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Lead
                </Button>
              )}

              {/* Add Status Button - with loading skeleton */}
              {showFilterSkeletons ? (
                <div className="w-[120px] h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
              ) : (
                <AddStatusButton disabled={isLoading} />
              )}

              {/* User Filter - reads from cache */}
              <UserFilter
                value={filterByUser}
                onChange={onFilterChange}
                disabled={isLoading}
                isLoading={showFilterSkeletons}
              />

              {/* Status Filter - reads from cache */}
              <StatusFilter
                value={filterByStatus}
                onChange={onStatusFilterChange}
                disabled={isLoading}
                isLoading={showFilterSkeletons}
              />

              {/* Source Filter - reads from cache */}
              <SourceFilter
                value={filterBySource}
                onChange={onSourceFilterChange}
                disabled={isLoading}
                isLoading={showFilterSkeletons}
              />

              {/* Country Filter - reads from cache */}
              <CountryFilter
                value={filterByCountry}
                onChange={onCountryFilterChange}
                disabled={isLoading}
                isLoading={showFilterSkeletons}
              />
            </ErrorBoundary>
          </div>
        </div>
      </div>

      {/* Add Lead Dialog */}
      <AddLeadDialog
        isOpen={isAddLeadDialogOpen}
        onClose={() => setIsAddLeadDialogOpen(false)}
      />
    </>
  );
};
