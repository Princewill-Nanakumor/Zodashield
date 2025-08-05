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
  // React Query to get leads for countries
  const {
    data: leads = [],
    isLoading,
    error,
  } = useQuery<Lead[]>({
    queryKey: ["leads", "all"],
    queryFn: async (): Promise<Lead[]> => {
      console.log("🔍 CountryFilter: Fetching leads...");
      const response = await fetch("/api/leads/all", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch leads");
      const data = await response.json();
      console.log("🔍 CountryFilter: Received leads:", data.length, "leads");
      return data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    refetchOnMount: false,
  });

  const countries = [
    ...new Set(leads.map((lead: Lead) => lead.country)),
  ].filter((country): country is string => Boolean(country));

  console.log("🔍 CountryFilter render:", {
    leadsCount: leads.length,
    countries,
    isLoading,
    error,
  });

  const options = [
    { value: "all", label: "All Countries" },
    ...countries.map((country: string) => ({
      value: country,
      label: country,
    })),
  ];

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
