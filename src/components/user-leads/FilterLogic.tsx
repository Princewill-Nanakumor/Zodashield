// src/components/user-leads/FilterLogic.tsx
"use client";

import { useMemo } from "react";
import { Lead } from "@/types/leads";

type SortField = "name" | "country" | "status" | "source" | "createdAt";
type SortOrder = "asc" | "desc";

// Optimized filter functions
const filterLeadsByCountry = (
  leads: Lead[],
  filterByCountry: string
): Lead[] => {
  if (!filterByCountry || filterByCountry === "all") return leads;
  return leads.filter(
    (lead) => lead.country?.toLowerCase() === filterByCountry.toLowerCase()
  );
};

interface FilterLogicProps {
  leads: Lead[];
  filterByCountry: string;
  sortField: SortField;
  sortOrder: SortOrder;
  isDataReady: boolean;
  children: (filteredData: {
    filteredLeads: Lead[];
    sortedLeads: Lead[];
    availableCountries: string[];
  }) => React.ReactNode;
}

export function FilterLogic({
  leads,
  filterByCountry,
  sortField,
  sortOrder,
  isDataReady,
  children,
}: FilterLogicProps) {
  // Optimized available countries with memoization
  const availableCountries = useMemo(() => {
    if (!isDataReady) return [];

    const countrySet = new Set<string>();
    leads.forEach((lead) => {
      if (lead.country?.trim()) {
        countrySet.add(lead.country.toLowerCase());
      }
    });

    return Array.from(countrySet).sort();
  }, [leads, isDataReady]);

  // Optimized filtered leads
  const filteredLeads = useMemo(() => {
    if (!isDataReady) return [];
    return filterLeadsByCountry(leads, filterByCountry);
  }, [leads, filterByCountry, isDataReady]);

  // Memoized sorted leads with early return
  const sortedLeads = useMemo(() => {
    if (!isDataReady || filteredLeads.length === 0) return [];

    return [...filteredLeads].sort((a, b) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;
      switch (sortField) {
        case "name":
          return (
            `${a.firstName} ${a.lastName}`.localeCompare(
              `${b.firstName} ${b.lastName}`
            ) * multiplier
          );
        case "country":
          return (a.country || "").localeCompare(b.country || "") * multiplier;
        case "status":
          return (a.status || "").localeCompare(b.status || "") * multiplier;
        case "source":
          return a.source.localeCompare(b.source) * multiplier;
        case "createdAt":
          return (
            (new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime()) *
            multiplier
          );
        default:
          return 0;
      }
    });
  }, [filteredLeads, sortField, sortOrder, isDataReady]);

  return (
    <>
      {children({
        filteredLeads,
        sortedLeads,
        availableCountries,
      })}
    </>
  );
}
