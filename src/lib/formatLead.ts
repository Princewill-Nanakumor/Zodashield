// src/lib/formatLead.ts
import { Lead, LeadSource } from "@/types/leads";
import { User } from "@/types/user.types";

interface ApiLead {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  name?: string;
  email: string;
  phone?: string;
  source: string;
  status?: string;
  country: string;
  assignedTo?:
    | string
    | { _id: string; firstName: string; lastName: string }
    | { id: string; firstName: string; lastName: string }
    | null;
  createdAt: string;
  updatedAt: string;
  comments?: string;
}

// Helper function to convert string source to LeadSource type
const convertSourceToLeadSource = (source: string): LeadSource => {
  const upperSource = source.toUpperCase();
  if (
    upperSource === "WEBSITE" ||
    upperSource === "REFERRAL" ||
    upperSource === "SOCIAL" ||
    upperSource === "EMAIL"
  ) {
    return upperSource as LeadSource;
  }
  return "OTHER";
};

// Helper function to get assigned user object - completely silent version
const getAssignedToUser = (
  assignedTo: ApiLead["assignedTo"],
  users: User[]
): { id: string; firstName: string; lastName: string } | null => {
  if (!assignedTo) {
    return null;
  }

  if (typeof assignedTo === "string") {
    const user = users.find((u) => u.id === assignedTo);
    if (user) {
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    }
    return null;
  }

  if (typeof assignedTo === "object" && assignedTo !== null) {
    // If it's already a complete user object with firstName and lastName, use it directly
    if (assignedTo.firstName && assignedTo.lastName) {
      return {
        id: "id" in assignedTo ? assignedTo.id : assignedTo._id,
        firstName: assignedTo.firstName,
        lastName: assignedTo.lastName,
      };
    }

    // Handle both _id and id properties for user lookup
    const userId = "id" in assignedTo ? assignedTo.id : assignedTo._id;

    if (userId) {
      const user = users.find((u) => u.id === userId);
      if (user) {
        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
        };
      }
    }
  }

  return null;
};

export const formatLead = (apiLead: ApiLead, users: User[]): Lead => {
  const assignedToObject = getAssignedToUser(apiLead.assignedTo, users);

  return {
    _id: apiLead._id || apiLead.id || "",
    id: apiLead.id || apiLead._id,
    firstName: apiLead.firstName,
    lastName: apiLead.lastName,
    name: apiLead.name || `${apiLead.firstName} ${apiLead.lastName}`.trim(),
    email: apiLead.email,
    phone: apiLead.phone,
    source: convertSourceToLeadSource(apiLead.source),
    status: apiLead.status || "NEW",
    country: apiLead.country,
    assignedTo: assignedToObject,
    createdAt: apiLead.createdAt,
    updatedAt: apiLead.updatedAt,
    // Don't include comments field since it's a string in API but Comment[] in Lead interface
  };
};
