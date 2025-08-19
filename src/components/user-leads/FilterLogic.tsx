// src/components/user-leads/FilterLogic.tsx
import React, { useMemo } from "react";
import { Lead } from "@/types/leads";

type SortField = "name" | "country" | "status" | "source" | "createdAt";
type SortOrder = "asc" | "desc";

interface FilterLogicProps {
  leads: Lead[];
  filterByCountry: string;
  filterByStatus: string;
  sortField: SortField;
  sortOrder: SortOrder;
  isDataReady: boolean;
  searchQuery?: string;
  children: (props: {
    filteredLeads: Lead[];
    sortedLeads: Lead[];
    availableCountries: string[];
    availableStatuses: string[];
  }) => React.ReactElement;
}

// Helper function to normalize phone numbers for search
const normalizePhoneNumber = (phone: string): string => {
  if (!phone) return "";
  const digitsOnly = phone.replace(/\D/g, "");
  if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
    return digitsOnly.substring(1);
  }
  if (digitsOnly.length === 10) {
    return digitsOnly;
  }
  return digitsOnly;
};

// Helper function to check if query looks like a phone number
const isPhoneNumber = (query: string): boolean => {
  const digitsOnly = query.replace(/\D/g, "");
  return digitsOnly.length >= 7;
};

export const FilterLogic: React.FC<FilterLogicProps> = ({
  leads,
  filterByCountry,
  filterByStatus,
  sortField,
  sortOrder,
  isDataReady,
  searchQuery = "",
  children,
}) => {
  // Get available countries - filter out undefined values and ensure string type
  const availableCountries = useMemo(() => {
    if (!isDataReady || leads.length === 0) return [];
    return [...new Set(leads.map((lead) => lead.country))]
      .filter((country): country is string => Boolean(country))
      .sort();
  }, [leads, isDataReady]);

  // Get available statuses - filter out undefined values and ensure string type
  const availableStatuses = useMemo(() => {
    if (!isDataReady || leads.length === 0) return [];
    return [...new Set(leads.map((lead) => lead.status))]
      .filter((status): status is string => Boolean(status))
      .sort();
  }, [leads, isDataReady]);

  // Filter leads by country, status, and search query
  const filteredLeads = useMemo(() => {
    if (!isDataReady) return [];

    return leads.filter((lead) => {
      const countryMatch =
        filterByCountry === "all" || lead.country === filterByCountry;

      const statusMatch =
        filterByStatus === "all" || lead.status === filterByStatus;

      let searchMatch = true;
      if (searchQuery && searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase().trim();

        if (isPhoneNumber(query)) {
          const normalizedQuery = normalizePhoneNumber(query);
          const leadPhone = normalizePhoneNumber(lead.phone || "");
          searchMatch = leadPhone.includes(normalizedQuery);
        } else {
          const fullName = `${lead.firstName} ${lead.lastName}`.toLowerCase();
          const email = (lead.email || "").toLowerCase();
          searchMatch = fullName.includes(query) || email.includes(query);
        }
      }

      return countryMatch && statusMatch && searchMatch;
    });
  }, [leads, filterByCountry, filterByStatus, searchQuery, isDataReady]);

  // Sort filtered leads
  const sortedLeads = useMemo(() => {
    if (!isDataReady || filteredLeads.length === 0) {
      return [];
    }

    return [...filteredLeads].sort((a, b) => {
      let aValue: string | number = "";
      let bValue: string | number = "";

      switch (sortField) {
        case "name":
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case "country":
          aValue = a.country?.toLowerCase() || "";
          bValue = b.country?.toLowerCase() || "";
          break;
        case "status":
          aValue = a.status?.toLowerCase() || "";
          bValue = b.status?.toLowerCase() || "";
          break;
        case "source":
          aValue = a.source?.toLowerCase() || "";
          bValue = b.source?.toLowerCase() || "";
          break;
        case "createdAt":
          aValue = new Date(a.createdAt || "").getTime();
          bValue = new Date(b.createdAt || "").getTime();
          break;
        default:
          return 0;
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
  }, [filteredLeads, sortField, sortOrder, isDataReady]);

  return children({
    filteredLeads,
    sortedLeads,
    availableCountries,
    availableStatuses,
  });
};
