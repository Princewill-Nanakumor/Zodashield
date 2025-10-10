// src/components/dashboardComponents/filters/SourceFilter.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { Lead } from "@/types/leads";
import { FilterSelect } from "./FilterSelect";

interface SourceFilterProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

export const SourceFilter = ({
  value,
  onChange,
  disabled,
}: SourceFilterProps) => {
  // React Query to get leads for sources
  const {
    data: leads = [],
    isLoading,
    error,
  } = useQuery<Lead[]>({
    queryKey: ["leads", "all"],
    queryFn: async (): Promise<Lead[]> => {
      console.log("🔍 SourceFilter: Fetching leads...");
      const response = await fetch("/api/leads/all", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch leads");
      const data = await response.json();
      console.log("🔍 SourceFilter: Received leads:", data.length, "leads");
      return data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    refetchOnMount: false,
  });

  // Extract unique sources from leads
  const sources = [
    ...new Set(
      leads
        .map((lead: Lead) => lead.source)
        .filter((source) => source && source.trim() !== "" && source !== "-")
    ),
  ].sort();

  console.log("🔍 SourceFilter render:", {
    leadsCount: leads.length,
    sources,
    isLoading,
    error,
  });

  const options = [
    { value: "all", label: "All Sources" },
    ...sources.map((source: string) => ({
      value: source,
      label: source,
    })),
  ];

  return (
    <FilterSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder="All Sources"
      disabled={disabled}
      isLoading={isLoading}
    />
  );
};
