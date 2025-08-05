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
  const { data: leads = [], isLoading: isLoadingLeads } = useQuery<Lead[]>({
    queryKey: ["leads", "all"],
    queryFn: async (): Promise<Lead[]> => {
      const response = await fetch("/api/leads/all", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch leads");
      return response.json();
    },
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 2,
    refetchOnMount: false,
  });

  const countries = [
    ...new Set(leads.map((lead: Lead) => lead.country)),
  ].filter((country): country is string => Boolean(country));

  const options = [
    { value: "all", label: "All Countries" },
    ...countries.map((country: string) => ({
      value: country,
      label: country.charAt(0).toUpperCase() + country.slice(1),
    })),
  ];

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
