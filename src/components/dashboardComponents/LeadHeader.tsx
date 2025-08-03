// src/components/dashboardComponents/LeadHeader.tsx
"use client";

import { Loader2, Users, Globe } from "lucide-react";

interface LeadsHeaderProps {
  shouldShowLoading: boolean;
  counts: {
    total: number;
    filtered: number;
    countries: number;
  };
  isRefetching?: boolean; // Add this prop for refetch indicator
}

export const LeadsHeader: React.FC<LeadsHeaderProps> = ({
  shouldShowLoading,
  counts,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6 rounded-t-lg">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            Leads Management
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage and track all your leads in one centralized dashboard
          </p>
        </div>
        <div className="flex items-center gap-3">
          {shouldShowLoading ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Loading...
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
              {counts.total.toLocaleString()} Total Leads
            </span>
          )}

          {shouldShowLoading ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Loading...
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300">
              {counts.filtered.toLocaleString()} Filtered
            </span>
          )}

          {shouldShowLoading ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Loading...
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              <Globe className="h-3 w-3 mr-1" />
              {counts.countries} Countries
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
