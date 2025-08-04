// src/components/dashboardComponents/LeadHeader.tsx
"use client";

import { Users, Globe } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

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
}) => {
  // React Query hooks for leads data - using the same query key as the main page
  const { data: leads = [], isLoading: isLoadingLeads } = useQuery<Lead[]>({
    queryKey: ["leads", "all"], // Same key as useLeadsPage
    queryFn: async (): Promise<Lead[]> => {
      const response = await fetch("/api/leads/all", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch leads");
      return response.json();
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    refetchOnMount: false,
  });

  // Calculate counts from React Query data
  const calculatedCounts = {
    total: leads.length,
    filtered: leads.length, // You can implement filtering logic here if needed
    countries: [...new Set(leads.map((lead: Lead) => lead.country))].length,
  };

  // Determine loading state
  const isLoading = shouldShowLoading || isLoadingLeads;

  // Use calculated counts from React Query, fallback to props if needed
  const displayCounts = leads.length > 0 ? calculatedCounts : counts;

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
