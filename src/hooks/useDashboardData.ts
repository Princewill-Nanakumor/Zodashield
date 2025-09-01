// src/hooks/useDashboardData.ts
import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  country: string;
  role: string;
  status: string;
  permissions: string[];
  createdBy: string;
  createdAt: string;
  lastLogin?: string;
}

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  country: string;
  status: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardStats {
  total: number;
  assigned: number;
  unassigned: number;
  myLeads: number;
}

// Utility function to get assigned user ID
const getAssignedUserId = (assignedTo: unknown): string | null => {
  if (!assignedTo) return null;
  if (typeof assignedTo === "string") return assignedTo;
  if (assignedTo && typeof assignedTo === "object") {
    const assignedToObj = assignedTo as Record<string, unknown>;
    if (assignedToObj.id && typeof assignedToObj.id === "string")
      return assignedToObj.id;
    if (assignedToObj._id && typeof assignedToObj._id === "string")
      return assignedToObj._id;
    return null;
  }
  return null;
};

// Fetch functions outside hooks to prevent recreation
const fetchUsers = async (): Promise<User[]> => {
  const response = await fetch("/api/users", {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : [];
};

const fetchLeads = async (isAdmin: boolean): Promise<Lead[]> => {
  const endpoint = isAdmin ? "/api/leads/all" : "/api/leads/assigned";

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error("Failed to fetch leads");
  }

  const data = await response.json();
  return Array.isArray(data)
    ? data
    : data.assignedLeads // /api/leads/assigned returns { assignedLeads: [...] }
      ? data.assignedLeads
      : [];
};

export const useUsersData = () => {
  const {
    data: users,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["users"], // ✅ FIXED: Use same query key as other components
    queryFn: fetchUsers,
    staleTime: 2 * 60 * 1000, // ✅ FIXED: Reduced from 5 minutes to 2 minutes
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: true,
  });

  return {
    users: users || [],
    isLoading,
    error,
    refreshUsers: refetch,
  };
};

export const useLeadsStats = (isAdmin: boolean) => {
  const {
    data: leads,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["leads"], // ✅ FIXED: Use same query key as leads page
    queryFn: () => fetchLeads(isAdmin),
    staleTime: 2 * 60 * 1000, // ✅ FIXED: Reduced from 5 minutes to 2 minutes
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: true,
  });

  // Calculate stats from leads data
  const stats: DashboardStats = leads
    ? (() => {
        if (isAdmin) {
          // Admin sees all stats
          const total = leads.length;
          const unassigned = leads.filter(
            (lead: Lead) => !getAssignedUserId(lead.assignedTo)
          ).length;
          const assigned = total - unassigned;

          return { total, assigned, unassigned, myLeads: 0 };
        } else {
          // Agent: Only count leads assigned to this user
          return {
            total: 0,
            assigned: 0,
            unassigned: 0,
            myLeads: leads.length,
          };
        }
      })()
    : { total: 0, assigned: 0, unassigned: 0, myLeads: 0 };

  return {
    stats,
    isLoading,
    error,
    refreshLeadsStats: refetch,
  };
};
