"use client";

import { useMemo, useCallback } from "react";
import { Lead } from "@/types/leads";
import { User } from "@/types/user.types";

type SortField =
  | "name"
  | "country"
  | "status"
  | "source"
  | "createdAt"
  | "assignedTo";
type SortOrder = "asc" | "desc";

interface TableSortingProps {
  leads: Lead[];
  sortField: SortField;
  sortOrder: SortOrder;
  users: User[];
  searchQuery?: string;
  onSortChange: (field: SortField, order: SortOrder) => void;
}

export const useTableSorting = ({
  leads,
  sortField,
  sortOrder,
  users,
  searchQuery = "",
  onSortChange,
}: TableSortingProps) => {
  // Search function
  const searchLeads = (leads: Lead[], query: string): Lead[] => {
    if (!query.trim()) return leads;

    const searchTerm = query.toLowerCase().trim();

    return leads.filter((lead) => {
      const fullName = `${lead.firstName} ${lead.lastName}`.toLowerCase();
      const email = lead.email.toLowerCase();
      const phone = (lead.phone || "").toLowerCase();

      return (
        fullName.includes(searchTerm) ||
        email.includes(searchTerm) ||
        phone.includes(searchTerm)
      );
    });
  };

  // Memoized sorting function with stable dependencies
  const sortedLeads = useMemo(() => {
    if (!Array.isArray(leads) || leads.length === 0) return [];

    // First apply search filter
    const filteredLeads = searchLeads(leads, searchQuery);

    // Then apply sorting
    return [...filteredLeads].sort((a, b) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;

      switch (sortField) {
        case "name": {
          const getDisplayName = (lead: Lead) =>
            lead.name?.trim() ||
            `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim();
          return (
            getDisplayName(a).localeCompare(getDisplayName(b)) * multiplier
          );
        }
        case "country":
          return (a.country || "").localeCompare(b.country || "") * multiplier;
        case "status":
          return (a.status || "").localeCompare(b.status || "") * multiplier;
        case "source":
          return (a.source || "").localeCompare(b.source || "") * multiplier;
        case "assignedTo": {
          const getAssignedUserName = (lead: Lead) => {
            if (!lead.assignedTo) return "";
            const userId =
              typeof lead.assignedTo === "string"
                ? lead.assignedTo
                : lead.assignedTo?.id || "";
            const user = users.find((u) => u.id === userId);
            return user ? `${user.firstName} ${user.lastName}`.trim() : "";
          };
          const nameA = getAssignedUserName(a);
          const nameB = getAssignedUserName(b);
          if (nameA === "" && nameB !== "") return -1 * multiplier;
          if (nameA !== "" && nameB === "") return 1 * multiplier;
          if (nameA === "" && nameB === "") return 0;
          return nameA.localeCompare(nameB) * multiplier;
        }
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
  }, [leads, searchQuery, sortField, sortOrder, users]);

  const handleSort = useCallback(
    (field: SortField) => {
      const newOrder =
        sortField === field && sortOrder === "asc" ? "desc" : "asc";
      onSortChange(field, newOrder);
    },
    [sortField, sortOrder, onSortChange]
  );

  return {
    sortedLeads,
    handleSort,
  };
};
