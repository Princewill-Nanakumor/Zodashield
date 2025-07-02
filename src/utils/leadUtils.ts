// src/utils/leadUtils.ts
import { Lead } from "@/types/leads";

export const getAssignedUserId = (
  assignedTo: Lead["assignedTo"]
): string | null => {
  if (!assignedTo) return null;
  return assignedTo.id || null;
};

export const getAssignedUserName = (assignedTo: Lead["assignedTo"]): string => {
  if (!assignedTo) return "Unassigned";
  return `${assignedTo.firstName} ${assignedTo.lastName}`.trim();
};

export const filterLeadsByUser = (
  leads: Lead[],
  filterByUser: string
): Lead[] => {
  switch (filterByUser) {
    case "unassigned":
      return leads.filter((lead) => !getAssignedUserId(lead.assignedTo));
    case "all":
      return leads;
    default:
      return leads.filter(
        (lead) => getAssignedUserId(lead.assignedTo) === filterByUser
      );
  }
};

export const isCurrentAssignee = (lead: Lead, userId: string): boolean => {
  return getAssignedUserId(lead.assignedTo) === userId;
};

export const getAssignedLeadsCount = (leads: Lead[]): number => {
  return leads.filter((lead) => !!getAssignedUserId(lead.assignedTo)).length;
};
