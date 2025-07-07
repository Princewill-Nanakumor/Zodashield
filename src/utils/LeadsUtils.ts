import { Lead } from "@/types/leads";

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
