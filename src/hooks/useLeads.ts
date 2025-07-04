// src/hooks/useLeads.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Lead } from "@/types/leads";
import { User } from "@/types/user.types";
import { useLeadsStore } from "@/stores/leadsStore";
import { useToast } from "@/components/ui/use-toast";

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

// Type for assignedTo object from API
interface AssignedToObject {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
}

// Simplified formatLead function
const formatLead = (apiLead: ApiLead, users: User[]): Lead => {
  let assignedToObject:
    | Pick<User, "id" | "firstName" | "lastName">
    | undefined = undefined;

  if (typeof apiLead.assignedTo === "object" && apiLead.assignedTo !== null) {
    // API returns object with _id or id, convert to id for frontend
    const assignedTo = apiLead.assignedTo as AssignedToObject;
    assignedToObject = {
      id: assignedTo._id || assignedTo.id || "",
      firstName: assignedTo.firstName,
      lastName: assignedTo.lastName,
    };
  } else if (typeof apiLead.assignedTo === "string") {
    const user = users.find((u) => u.id === apiLead.assignedTo);
    if (user) {
      assignedToObject = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
      };
    }
  }

  return {
    ...apiLead,
    _id: apiLead._id || apiLead.id || "",
    id: apiLead.id || apiLead._id,
    name: apiLead.name || `${apiLead.firstName} ${apiLead.lastName}`.trim(),
    status: apiLead.status || "NEW",
    assignedTo: assignedToObject,
  } as Lead;
};

export const useLeads = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    setLeads,
    setLoadingLeads,
    setLoadingUsers,
    setUsers,
    setStatuses,
    setLoadingStatuses,
  } = useLeadsStore();

  // Fetch statuses
  const { data: statuses = [] } = useQuery({
    queryKey: ["statuses"],
    queryFn: async (): Promise<
      Array<{ id: string; name: string; color?: string }>
    > => {
      setLoadingStatuses(true);
      try {
        const response = await fetch("/api/statuses");
        if (!response.ok) throw new Error("Failed to fetch statuses");
        const data = await response.json();
        const statusesArray = data.statuses || data || [];
        setStatuses(statusesArray);
        return statusesArray;
      } catch (error) {
        console.error("Error fetching statuses:", error);
        toast({
          title: "Error loading statuses",
          description:
            error instanceof Error
              ? error.message
              : "An unknown error occurred.",
          variant: "destructive",
        });
        return [];
      } finally {
        setLoadingStatuses(false);
      }
    },
    staleTime: 10 * 60 * 1000,
  });

  // Fetch users
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<User[]> => {
      setLoadingUsers(true);
      try {
        const res = await fetch("/api/users");
        if (!res.ok) throw new Error("Failed to fetch users");
        const usersData = await res.json();
        const usersArray = Array.isArray(usersData)
          ? usersData
          : usersData.users;
        if (!Array.isArray(usersArray)) {
          throw new Error("User data from API is not in a valid format.");
        }
        const activeUsers = usersArray.filter(
          (u: User) => u.status === "ACTIVE"
        );
        setUsers(activeUsers);
        return activeUsers;
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error loading users",
          description:
            error instanceof Error
              ? error.message
              : "An unknown error occurred.",
          variant: "destructive",
        });
        return [];
      } finally {
        setLoadingUsers(false);
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch leads
  const { data: leads = [], isLoading: isLoadingLeads } = useQuery({
    queryKey: ["leads"],
    queryFn: async (): Promise<Lead[]> => {
      setLoadingLeads(true);
      try {
        const response = await fetch("/api/leads/all");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch leads");
        }

        const data: ApiLead[] = await response.json();
        console.log("Raw API leads data:", data.slice(0, 2)); // Debug log

        const formattedLeads = data.map((apiLead) =>
          formatLead(apiLead, users)
        );

        console.log("Formatted leads:", formattedLeads.slice(0, 2)); // Debug log

        // Update Zustand store
        setLeads(formattedLeads);
        return formattedLeads;
      } catch (error) {
        console.error("Error fetching leads:", error);
        toast({
          title: "Error",
          description: "Failed to fetch leads",
          variant: "destructive",
        });
        return [];
      } finally {
        setLoadingLeads(false);
      }
    },
    enabled: users.length > 0,
    staleTime: 2 * 60 * 1000,
  });

  // Assignment mutation - REMOVED optimistic updates to avoid conflicts
  const assignLeadsMutation = useMutation({
    mutationFn: async ({
      leadIds,
      userId,
    }: {
      leadIds: string[];
      userId: string;
    }) => {
      const response = await fetch("/api/leads/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds, userId }),
      });

      if (!response.ok) {
        throw new Error(
          (await response.json()).message || "Failed to assign leads."
        );
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log("Assignment successful:", data);
      // Invalidate and refetch leads to get fresh data from server
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({
        title: "Success",
        description: "Leads assigned successfully",
        variant: "default",
      });
    },
    onError: (err) => {
      console.error("Assignment failed:", err);
      toast({
        title: "Assignment Failed",
        description:
          err instanceof Error ? err.message : "An unknown error occurred.",
        variant: "destructive",
      });
    },
  });

  // Unassignment mutation - REMOVED optimistic updates to avoid conflicts
  const unassignLeadsMutation = useMutation({
    mutationFn: async ({ leadIds }: { leadIds: string[] }) => {
      const response = await fetch("/api/leads/unassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds }),
      });

      if (!response.ok) {
        throw new Error(
          (await response.json()).message || "Failed to unassign leads."
        );
      }

      return response.json();
    },
    onSuccess: (data) => {
      console.log("Unassignment successful:", data);
      // Invalidate and refetch leads to get fresh data from server
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({
        title: "Success",
        description: "Leads unassigned successfully",
        variant: "default",
      });
    },
    onError: (err) => {
      console.error("Unassignment failed:", err);
      toast({
        title: "Unassignment Failed",
        description:
          err instanceof Error ? err.message : "An unknown error occurred.",
        variant: "destructive",
      });
    },
  });

  return {
    leads,
    users,
    statuses,
    isLoadingLeads,
    isLoadingUsers: useLeadsStore((state) => state.isLoadingUsers),
    isLoadingStatuses: useLeadsStore((state) => state.isLoadingStatuses),
    assignLeads: assignLeadsMutation.mutateAsync,
    unassignLeads: unassignLeadsMutation.mutateAsync,
    isAssigning: assignLeadsMutation.isPending,
    isUnassigning: unassignLeadsMutation.isPending,
  };
};
