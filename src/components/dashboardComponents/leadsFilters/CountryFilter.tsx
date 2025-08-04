// src/components/dashboardComponents/filters/CountryFilter.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { Lead } from "@/types/leads";
import { FilterSelect } from "./FilterSelect";

interface CountryFilterProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

export const CountryFilter = ({
  value,
  onChange,
  disabled,
}: CountryFilterProps) => {
  // Use React Query to get leads for countries
  const { data: leads = [], isLoading: isLoadingLeads } = useQuery<Lead[]>({
    queryKey: ["leads", "all"],
    queryFn: async (): Promise<Lead[]> => {
      const response = await fetch("/api/leads/all", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch leads");
      return response.json();
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - data is fresh for 30 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    refetchOnMount: false, // Don't refetch if data exists
  });

  // Calculate countries from leads data with proper typing
  const countries = [
    ...new Set(leads.map((lead: Lead) => lead.country)),
  ].filter((country): country is string => Boolean(country));

  const options = countries.map((country: string) => ({
    value: country,
    label: country.charAt(0).toUpperCase() + country.slice(1),
  }));

  return (
    <FilterSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder="All Countries"
      disabled={disabled}
      isLoading={isLoadingLeads}
    />
  );
};
