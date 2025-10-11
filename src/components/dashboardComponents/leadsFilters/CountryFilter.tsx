// src/components/dashboardComponents/filters/CountryFilter.tsx
"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
