// src/utils/LeadUtils.ts
import { Lead } from "@/types/leads";

// Constants for filter values
export const FILTER_VALUES = {
  ALL: "all",
  UNASSIGNED: "unassigned",
} as const;

// Utility functions for lead filtering and processing
export const getAssignedUserId = (
  assignedTo: Lead["assignedTo"]
): string | null => {
  if (!assignedTo) return null;
  if (typeof assignedTo === "string") return assignedTo;
  if (assignedTo && typeof assignedTo === "object") {
    const assignedToObj = assignedTo as Record<string, unknown>;
    return (
      (assignedToObj.id as string) || (assignedToObj._id as string) || null
    );
  }
  return null;
};

export const getAssignedUserName = (
  assignedTo: Lead["assignedTo"]
): string | null => {
  if (!assignedTo) return null;
  if (typeof assignedTo === "string") return assignedTo;
  if (assignedTo && typeof assignedTo === "object") {
    const assignedToObj = assignedTo as Record<string, unknown>;
    const firstName = (assignedToObj.firstName as string) || "";
    const lastName = (assignedToObj.lastName as string) || "";
    return `${firstName} ${lastName}`.trim();
  }
  return null;
};

// In your leadUtils.ts:

// In your LeadUtils.ts, update the filterLeadsByStatus function:

export const filterLeadsByStatus = (
  leads: Lead[],
  statusFilter: string,
  statuses: Array<{ _id: string; name: string }> = []
): Lead[] => {
  console.log("🔍 filterLeadsByStatus called:", {
    statusFilter,
    totalLeads: leads.length,
    availableStatuses: statuses,
    sampleLeads: leads.slice(0, 3).map((lead) => ({
      id: lead._id,
      status: lead.status,
      statusType: typeof lead.status,
    })),
  });

  if (!statusFilter || statusFilter === "all") {
    console.log("🔍 No status filter, returning all leads");
    return leads;
  }

  // Create a mapping from status ObjectID to status name
  const statusIdToName: Record<string, string> = {};
  statuses.forEach((status) => {
    statusIdToName[status._id] = status.name;
  });

  console.log("🔍 Status ID to Name mapping:", statusIdToName);

  const filtered = leads.filter((lead) => {
    const leadStatusId = lead.status;
    const leadStatusName = statusIdToName[leadStatusId];

    console.log("🔍 Checking lead status:", {
      leadId: lead._id,
      leadStatusId,
      leadStatusName,
      statusFilter,
      matches: leadStatusName === statusFilter,
    });

    return leadStatusName === statusFilter;
  });

  console.log("🔍 filterLeadsByStatus result:", {
    statusFilter,
    filteredCount: filtered.length,
    sampleFiltered: filtered.slice(0, 3).map((lead) => ({
      id: lead._id,
      status: lead.status,
      statusName: statusIdToName[lead.status],
    })),
  });

  return filtered;
};

export const filterLeadsByUser = (
  leads: Lead[],
  filterByUser: string
): Lead[] => {
  if (filterByUser === "all") return leads;
  if (filterByUser === "unassigned") {
    return leads.filter((lead) => !getAssignedUserId(lead.assignedTo));
  }
  return leads.filter(
    (lead) => getAssignedUserId(lead.assignedTo) === filterByUser
  );
};

export const filterLeadsByCountry = (
  leads: Lead[],
  filterByCountry: string
): Lead[] => {
  if (!filterByCountry || filterByCountry === "all") return leads;
  return leads.filter(
    (lead) => lead.country?.toLowerCase() === filterByCountry.toLowerCase()
  );
};

export const searchLeads = (leads: Lead[], searchQuery: string): Lead[] => {
  if (!searchQuery.trim()) {
    console.log("searchLeads: No search query, returning all leads");
    return leads;
  }

  const query = searchQuery.toLowerCase().trim();
  console.log(
    "searchLeads: Searching for:",
    query,
    "in",
    leads.length,
    "leads"
  );

  const results = leads.filter((lead) => {
    const fullName = `${lead.firstName || ""} ${lead.lastName || ""}`
      .toLowerCase()
      .trim();
    const email = (lead.email || "").toLowerCase();
    const phone = (lead.phone || "").toLowerCase();

    const matches =
      fullName.includes(query) ||
      email.includes(query) ||
      phone.includes(query);

    if (matches) {
      console.log("searchLeads: Match found:", {
        id: lead._id,
        name: fullName,
        email,
        phone,
        query,
      });
    }

    return matches;
  });

  console.log(
    "searchLeads: Found",
    results.length,
    "matches for query:",
    query
  );
  return results;
};

export const getAssignedLeadsCount = (leads: Lead[]): number => {
  return leads.filter((lead) => !!getAssignedUserId(lead.assignedTo)).length;
};

export const getAvailableCountries = (leads: Lead[]): string[] => {
  const countrySet = new Set<string>();
  leads.forEach((lead) => {
    if (lead.country?.trim()) {
      countrySet.add(lead.country.toLowerCase());
    }
  });
  return Array.from(countrySet).sort();
};

// Check if user is current assignee
export const isCurrentAssignee = (lead: Lead, userId: string): boolean => {
  return getAssignedUserId(lead.assignedTo) === userId;
};

// Validate session user with proper typing
export const validateSessionUser = (
  session: unknown
): session is { user: { role: string; id: string } } => {
  return (
    typeof session === "object" &&
    session !== null &&
    "user" in session &&
    typeof (session as { user: unknown }).user === "object" &&
    (session as { user: { role?: unknown; id?: unknown } }).user !== null &&
    "role" in (session as { user: { role?: unknown; id?: unknown } }).user &&
    "id" in (session as { user: { role?: unknown; id?: unknown } }).user &&
    typeof (session as { user: { role: unknown; id: unknown } }).user.role ===
      "string" &&
    typeof (session as { user: { role: unknown; id: unknown } }).user.id ===
      "string"
  );
};

// Check if user has admin role
export const isAdminUser = (session: unknown): boolean => {
  return validateSessionUser(session) && session.user.role === "ADMIN";
};
