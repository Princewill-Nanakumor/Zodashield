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

// Updated filterLeadsByStatus function to handle both string and ObjectID statuses, and arrays
export const filterLeadsByStatus = (
  leads: Lead[],
  statusFilter: string | string[],
  statuses: Array<{ _id: string; name: string }> = []
): Lead[] => {
  // Handle array (multi-select)
  if (Array.isArray(statusFilter)) {
    if (statusFilter.length === 0) return leads; // Empty array means "all"
    
    // Create mappings
    const statusIdToName: Record<string, string> = {};
    const statusNameToId: Record<string, string> = {};
    statuses.forEach((status) => {
      statusIdToName[status._id] = status.name;
      statusNameToId[status.name] = status._id;
      statusNameToId[status.name.toUpperCase()] = status._id;
      statusNameToId[status.name.toLowerCase()] = status._id;
    });
    
    return leads.filter((lead) => {
      const leadStatus = lead.status;
      let leadStatusId: string | null = null;
      
      // Convert lead status to ID if needed
      if (typeof leadStatus === "string") {
        if (leadStatus.length === 24) {
          // ObjectID
          leadStatusId = leadStatus;
        } else {
          // Status name - convert to ID
          leadStatusId = statusNameToId[leadStatus] || leadStatus;
        }
      }
      
      // Check if lead status matches any selected filter
      return statusFilter.some((filterValue) => {
        // Direct match
        if (leadStatus === filterValue || leadStatusId === filterValue) return true;
        // Case-insensitive match
        if (leadStatus?.toUpperCase() === filterValue.toUpperCase()) return true;
        // ID to name mapping
        if (statusIdToName[leadStatus] === filterValue) return true;
        if (statusIdToName[leadStatusId || ""] === filterValue) return true;
        // Name to ID mapping
        if (statusNameToId[filterValue] === leadStatus) return true;
        if (statusNameToId[filterValue] === leadStatusId) return true;
        return false;
      });
    });
  }
  
  // Handle string (single-select - backward compatibility)
  console.log("🔍 filterLeadsByStatus called:", {
    statusFilter,
    totalLeads: leads.length,
    availableStatuses: statuses.map((s) => s.name),
    statusesData: statuses,
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

  // Create a mapping from status name to ObjectID for custom statuses
  const statusNameToId: Record<string, string> = {};
  statuses.forEach((status) => {
    statusNameToId[status.name] = status._id;
  });

  console.log("🔍 Status name to ID mapping:", statusNameToId);

  // Since leads store status as string names, we can filter directly
  const filtered = leads.filter((lead) => {
    const leadStatus = lead.status;

    // Handle different status formats
    let leadStatusName: string;

    // If lead status is a string
    if (typeof leadStatus === "string") {
      // Check if it's an ObjectID (24 character string)
      if (leadStatus.length === 24) {
        // This is likely an ObjectID, try to find the corresponding status name
        const statusObj = statuses.find((s) => s._id === leadStatus);
        leadStatusName = statusObj?.name || leadStatus;
      } else {
        // Regular string status name
        leadStatusName = leadStatus;
      }
    }
    // If lead status is an object with name property
    else if (
      leadStatus &&
      typeof leadStatus === "object" &&
      "name" in leadStatus
    ) {
      leadStatusName = (leadStatus as { name: string }).name;
    }
    // Fallback for any other type
    else {
      leadStatusName = String(leadStatus || "");
    }

    console.log("🔍 Checking lead status:", {
      leadId: lead._id,
      leadStatus,
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
    })),
  });

  return filtered;
};

export const filterLeadsByUser = (
  leads: Lead[],
  filterByUser: string | string[]
): Lead[] => {
  // Handle array (multi-select)
  if (Array.isArray(filterByUser)) {
    if (filterByUser.length === 0) return leads; // Empty array means "all"
    
    const hasUnassigned = filterByUser.includes("unassigned");
    const userIds = filterByUser.filter((id) => id !== "unassigned");
    
    return leads.filter((lead) => {
      const assignedUserId = getAssignedUserId(lead.assignedTo);
      if (hasUnassigned && !assignedUserId) return true;
      if (userIds.length > 0 && assignedUserId && userIds.includes(assignedUserId)) return true;
      return false;
    });
  }
  
  // Handle string (single-select - backward compatibility)
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
  filterByCountry: string | string[]
): Lead[] => {
  // Handle array (multi-select)
  if (Array.isArray(filterByCountry)) {
    if (filterByCountry.length === 0) return leads; // Empty array means "all"
    return leads.filter((lead) =>
      filterByCountry.some(
        (country) =>
          lead.country?.toLowerCase() === country.toLowerCase()
      )
    );
  }
  
  // Handle string (single-select - backward compatibility)
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
