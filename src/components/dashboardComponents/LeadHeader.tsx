"use client";

import { Globe } from "lucide-react";

interface Lead {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  status: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface LeadsHeaderProps {
  shouldShowLoading: boolean;
  counts: {
    total: number;
    filtered: number;
    countries: number;
  };
  filteredLeads?: Lead[]; // Add this prop to receive filtered leads
  allLeads?: Lead[]; // Add this prop to receive all leads
}

// Loading skeleton components
const CountSkeleton = () => (
  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
    <div className="h-3 w-12 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
  </div>
);

const FilteredSkeleton = () => (
  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300">
    <div className="h-3 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
  </div>
);

const CountriesSkeleton = () => (
  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
    <Globe className="h-3 w-3 mr-1" />
    <div className="h-3 w-8 bg-blue-300 dark:bg-blue-700 rounded animate-pulse"></div>
  </div>
);

export const LeadsHeader: React.FC<LeadsHeaderProps> = ({
  shouldShowLoading,
  counts,
  filteredLeads = [],
  allLeads = [],
}) => {
  // Calculate counts based on the provided data
  const calculatedCounts = {
    total: allLeads.length,
    filtered: filteredLeads.length,
    countries: [...new Set(allLeads.map((lead: Lead) => lead.country))].length,
  };

  // Use calculated counts if we have data, otherwise fall back to props
  const displayCounts = allLeads.length > 0 ? calculatedCounts : counts;
  const isLoading = shouldShowLoading;

  return (
    <div className="bg-white dark:bg-gray-800  dark:border-gray-700 px-8 pt-6 rounded-t-xl ">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            Leads Management
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage and track all your leads in one centralized dashboard
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isLoading ? (
            <CountSkeleton />
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
              {displayCounts.total.toLocaleString()} Total Leads
            </span>
          )}

          {isLoading ? (
            <FilteredSkeleton />
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300">
              {displayCounts.filtered.toLocaleString()} Filtered
            </span>
          )}

          {isLoading ? (
            <CountriesSkeleton />
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              <Globe className="h-3 w-3 mr-1" />
              {displayCounts.countries} Countries
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
