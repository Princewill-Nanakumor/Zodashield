// src/components/dashboardComponents/filters/CountryFilter.tsx
"use client";

import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Lead } from "@/types/leads";
import { FilterSelect } from "./FilterSelect";

interface CountryFilterProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  isLoading?: boolean;
}

export const CountryFilter = ({
  value,
  onChange,
  disabled,
  isLoading = false,
}: CountryFilterProps) => {
  const queryClient = useQueryClient();

  // ✅ OPTIMIZATION: Get data from existing cache instead of fetching
  const leads = useMemo(() => {
    return queryClient.getQueryData<Lead[]>(["leads"]) || [];
  }, [queryClient]);

  const countries = useMemo(() => {
    return [...new Set(leads.map((lead: Lead) => lead.country))].filter(
      (country): country is string => Boolean(country)
    );
  }, [leads]);

  const options = useMemo(
    () => [
      { value: "all", label: "All Countries" },
      ...countries.map((country: string) => ({
        value: country,
        label: country,
      })),
    ],
    [countries]
  );

  return (
    <FilterSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder="All Countries"
      disabled={disabled}
      isLoading={isLoading}
    />
  );
};
