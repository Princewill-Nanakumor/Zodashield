// src/components/dashboardComponents/filters/SourceFilter.tsx
"use client";

import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  // ✅ OPTIMIZATION: Get data from existing cache instead of fetching
  const leads = useMemo(() => {
    return queryClient.getQueryData<Lead[]>(["leads"]) || [];
  }, [queryClient]);

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
