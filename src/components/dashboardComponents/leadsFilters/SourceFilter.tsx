// src/components/dashboardComponents/filters/SourceFilter.tsx
"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Lead } from "@/types/leads";
import { FilterSelect } from "./FilterSelect";

interface SourceFilterProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  isLoading?: boolean;
}

export const SourceFilter = ({
  value,
  onChange,
  disabled,
  isLoading = false,
}: SourceFilterProps) => {
  // ✅ FIX: Use useQuery to subscribe to cache updates
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["leads"],
    queryFn: async () => {
      const response = await fetch("/api/leads/all", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch leads");
      return response.json();
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });

  // Extract unique sources from leads
  const sources = useMemo(() => {
    return [
      ...new Set(
        leads
          .map((lead: Lead) => lead.source)
          .filter((source) => source && source.trim() !== "" && source !== "-")
      ),
    ].sort();
  }, [leads]);

  const options = useMemo(
    () => [
      { value: "all", label: "All Sources" },
      ...sources.map((source: string) => ({
        value: source,
        label: source,
      })),
    ],
    [sources]
  );

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
