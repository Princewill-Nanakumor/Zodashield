"use client";

import { useMemo, useCallback } from "react";
import { Lead } from "@/types/leads";
import { User } from "@/types/user.types";

type SortField =
  | "leadId"
  | "name"
  | "country"
  | "status"
  | "source"
  | "createdAt"
  | "assignedTo"
  | "lastComment"
  | "lastCommentDate"
  | "commentCount";
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

    const trimmedQuery = query.trim();
    const searchTerm = trimmedQuery.toLowerCase();

    // Check if query is a numeric ID (5-6 digits) - check original trimmed query
    const isNumericIdSearch = /^\d{5,6}$/.test(trimmedQuery);
    const numericId = isNumericIdSearch ? parseInt(trimmedQuery, 10) : null;
    
    return leads.filter((lead) => {
      // Search by leadId if query is numeric (exact match)
      if (numericId !== null && lead.leadId === numericId) {
        return true;
      }

      // If query is numeric but doesn't match leadId, don't search in other fields
      if (isNumericIdSearch) {
        return false;
      }

      // Search in name, email, phone for non-numeric queries
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
        case "leadId": {
          const idA = a.leadId || 0;
          const idB = b.leadId || 0;
          return (idA - idB) * multiplier;
        }
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
        case "lastComment": {
          const commentA = (a.lastComment || "").toLowerCase();
          const commentB = (b.lastComment || "").toLowerCase();
          if (commentA === "" && commentB !== "") return -1 * multiplier;
          if (commentA !== "" && commentB === "") return 1 * multiplier;
          if (commentA === "" && commentB === "") return 0;
          return commentA.localeCompare(commentB) * multiplier;
        }
        case "lastCommentDate": {
          const dateA = a.lastCommentDate ? new Date(a.lastCommentDate).getTime() : 0;
          const dateB = b.lastCommentDate ? new Date(b.lastCommentDate).getTime() : 0;
          // Leads without comments should go to the end
          if (dateA === 0 && dateB !== 0) return 1 * multiplier;
          if (dateA !== 0 && dateB === 0) return -1 * multiplier;
          if (dateA === 0 && dateB === 0) return 0;
          return (dateA - dateB) * multiplier;
        }
        case "commentCount": {
          const countA = a.commentCount || 0;
          const countB = b.commentCount || 0;
          return (countA - countB) * multiplier;
        }
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
