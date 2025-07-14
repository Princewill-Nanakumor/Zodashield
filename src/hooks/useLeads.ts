import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Lead } from "@/types/leads";
import { User } from "@/types/user.types";
import { useLeadsStore } from "@/stores/leadsStore";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";

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

// Helper function to handle API calls with session refresh
const apiCallWithSessionRefresh = async (
  url: string,
  options: RequestInit = {}
) => {
  try {
    // First attempt
    const response = await fetch(url, {
      ...options,
      credentials: "include", // Always include cookies
    });

    // If unauthorized, try to refresh session
    if (response.status === 401) {
      console.log("Session expired, attempting refresh...");

      // Try to refresh the session
      const refreshResponse = await fetch("/api/auth/session", {
        credentials: "include",
      });

      if (refreshResponse.ok) {
        // Retry the original request
        return await fetch(url, {
          ...options,
          credentials: "include",
        });
      } else {
        // Refresh failed, redirect to login
        window.location.href = "/signin";
        throw new Error("Session refresh failed");
      }
    }

    return response;
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
};

export const useLeads = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { status } = useSession();
  const {
    setLeads,
    setLoadingLeads,
    setLoadingUsers,
    setUsers,
    setStatuses,
    setLoadingStatuses,
  } = useLeadsStore();

  // Fetch statuses with retry logic and session refresh
  const { data: statuses = [] } = useQuery({
    queryKey: ["statuses"],
    queryFn: async (): Promise<
      Array<{ id: string; name: string; color?: string }>
    > => {
      setLoadingStatuses(true);
      try {
        const response = await apiCallWithSessionRefresh("/api/statuses", {
          cache: "no-store",
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          if (response.status === 503) {
            throw new Error("Database connection error. Please try again.");
          }
          throw new Error("Failed to fetch statuses");
        }

        const data = await response.json();
        const statusesArray = data.statuses || data || [];
        setStatuses(statusesArray);
        return statusesArray;
      } catch (error) {
        console.error("Error fetching statuses:", error);

        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred.";

        toast({
          title: "Error loading statuses",
          description: errorMessage,
          variant: "destructive",
        });

        return [];
      } finally {
        setLoadingStatuses(false);
      }
    },
    retry: (failureCount, error) => {
      if (
        failureCount < 3 &&
        error instanceof Error &&
        (error.message.includes("connection") ||
          error.message.includes("timeout"))
      ) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 10 * 60 * 1000,
    enabled: status === "authenticated",
  });

  // Fetch users with retry logic and session refresh
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async (): Promise<User[]> => {
      setLoadingUsers(true);
      try {
        const response = await apiCallWithSessionRefresh("/api/users", {
          cache: "no-store",
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          if (response.status === 503) {
            throw new Error("Database connection error. Please try again.");
          }
          throw new Error("Failed to fetch users");
        }

        const usersData = await response.json();
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

        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred.";

        toast({
          title: "Error loading users",
          description: errorMessage,
          variant: "destructive",
        });

        return [];
      } finally {
        setLoadingUsers(false);
      }
    },
    retry: (failureCount, error) => {
      if (
        failureCount < 3 &&
        error instanceof Error &&
        (error.message.includes("connection") ||
          error.message.includes("timeout"))
      ) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    enabled: status === "authenticated",
  });

  // Fetch leads with retry logic and session refresh
  const { data: leads = [], isLoading: isLoadingLeads } = useQuery({
    queryKey: ["leads"],
    queryFn: async (): Promise<Lead[]> => {
      setLoadingLeads(true);
      try {
        console.log("🔄 Fetching leads from /api/leads/all...");
        const response = await apiCallWithSessionRefresh("/api/leads/all", {
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        });

        if (!response.ok) {
          if (response.status === 503) {
            throw new Error("Database connection error. Please try again.");
          }
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch leads");
        }

        const data: ApiLead[] = await response.json();
        console.log("�� Raw API leads data:", {
          count: data.length,
          sample: data.slice(0, 2),
        });

        // Format leads without depending on users
        const formattedLeads = data.map((apiLead) => {
          let assignedToObject:
            | Pick<User, "id" | "firstName" | "lastName">
            | undefined = undefined;

          if (
            typeof apiLead.assignedTo === "object" &&
            apiLead.assignedTo !== null
          ) {
            const assignedTo = apiLead.assignedTo as AssignedToObject;
            assignedToObject = {
              id: assignedTo._id || assignedTo.id || "",
              firstName: assignedTo.firstName,
              lastName: assignedTo.lastName,
            };
          }

          return {
            ...apiLead,
            _id: apiLead._id || apiLead.id || "",
            id: apiLead.id || apiLead._id,
            name:
              apiLead.name || `${apiLead.firstName} ${apiLead.lastName}`.trim(),
            status: apiLead.status || "NEW",
            assignedTo: assignedToObject,
          } as Lead;
        });

        console.log("�� Formatted leads:", {
          count: formattedLeads.length,
          sample: formattedLeads.slice(0, 2),
        });

        setLeads(formattedLeads);
        return formattedLeads;
      } catch (error) {
        console.error("Error fetching leads:", error);

        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred.";

        toast({
          title: "Error loading leads",
          description: errorMessage,
          variant: "destructive",
        });

        return [];
      } finally {
        setLoadingLeads(false);
      }
    },
    retry: (failureCount, error) => {
      if (
        failureCount < 3 &&
        error instanceof Error &&
        (error.message.includes("connection") ||
          error.message.includes("timeout"))
      ) {
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 2 * 60 * 1000,
    // Remove the users dependency - this was causing the issue!
    enabled: status === "authenticated",
  });

  // Assignment mutation with optimistic updates and session refresh
  const assignLeadsMutation = useMutation({
    mutationFn: async ({
      leadIds,
      userId,
    }: {
      leadIds: string[];
      userId: string;
    }) => {
      const response = await apiCallWithSessionRefresh("/api/leads/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds, userId }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error("Database connection error. Please try again.");
        }
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to assign leads");
      }

      return response.json();
    },
    onMutate: async ({ leadIds, userId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["leads"] });

      // Snapshot the previous value
      const previousLeads = queryClient.getQueryData(["leads"]) as Lead[];

      // Find the user being assigned
      const assignedUser = users.find((u) => u.id === userId);
      if (!assignedUser) throw new Error("User not found");

      // Optimistically update the leads
      const optimisticLeads =
        previousLeads?.map((lead) =>
          leadIds.includes(lead._id)
            ? {
                ...lead,
                assignedTo: {
                  id: assignedUser.id,
                  firstName: assignedUser.firstName,
                  lastName: assignedUser.lastName,
                },
                updatedAt: new Date().toISOString(),
              }
            : lead
        ) || [];

      // Update the cache optimistically
      queryClient.setQueryData(["leads"], optimisticLeads);

      // Update Zustand store
      setLeads(optimisticLeads);

      // Return a context object with the snapshotted value
      return { previousLeads };
    },
    onError: (err, variables, context) => {
      console.error("Assignment failed:", err);
      if (context?.previousLeads) {
        queryClient.setQueryData(["leads"], context.previousLeads);
        setLeads(context.previousLeads);
      }

      toast({
        title: "Assignment Failed",
        description:
          err instanceof Error ? err.message : "An unknown error occurred.",
        variant: "destructive",
      });
    },
    onSuccess: (data, variables) => {
      console.log("Assignment successful:", data);
      queryClient.invalidateQueries({ queryKey: ["leads"] });
      const { leadIds, userId } = variables;
      const assignedUser = users.find((u) => u.id === userId);
      const leadCount = leadIds.length;

      const userFullName = assignedUser
        ? `${assignedUser.firstName} ${assignedUser.lastName}`
        : "Unknown User";

      const leadText = leadCount === 1 ? "lead" : "leads";

      toast({
        title: "Leads Assigned Successfully",
        description: `${leadCount} ${leadText} assigned to ${userFullName}`,
        variant: "success",
      });
    },
  });

  const unassignLeadsMutation = useMutation({
    mutationFn: async ({ leadIds }: { leadIds: string[] }) => {
      const response = await apiCallWithSessionRefresh("/api/leads/unassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds }),
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error("Database connection error. Please try again.");
        }
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to unassign leads");
      }

      return response.json();
    },
    onMutate: async ({ leadIds }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["leads"] });

      // Snapshot the previous value
      const previousLeads = queryClient.getQueryData(["leads"]) as Lead[];

      // Get the users that the leads were assigned to before unassignment
      const leadsToUnassign =
        previousLeads?.filter(
          (lead) => leadIds.includes(lead._id) && lead.assignedTo
        ) || [];

      // Group leads by assigned user
      const leadsByUser = leadsToUnassign.reduce(
        (acc, lead) => {
          if (lead.assignedTo) {
            const userId = lead.assignedTo.id;
            if (!acc[userId]) {
              acc[userId] = {
                user: lead.assignedTo,
                count: 0,
              };
            }
            acc[userId].count++;
          }
          return acc;
        },
        {} as Record<
          string,
          {
            user: { id: string; firstName: string; lastName: string };
            count: number;
          }
        >
      );

      // Optimistically update the leads
      const optimisticLeads =
        previousLeads?.map((lead) =>
          leadIds.includes(lead._id)
            ? {
                ...lead,
                assignedTo: null,
                updatedAt: new Date().toISOString(),
              }
            : lead
        ) || [];

      // Update the cache optimistically
      queryClient.setQueryData(["leads"], optimisticLeads);

      // Update Zustand store
      setLeads(optimisticLeads);

      // Return a context object with the snapshotted value and user info
      return { previousLeads, leadsByUser };
    },
    onError: (err, variables, context) => {
      console.error("Unassignment failed:", err);

      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousLeads) {
        queryClient.setQueryData(["leads"], context.previousLeads);
        setLeads(context.previousLeads);
      }

      toast({
        title: "Unassignment Failed",
        description:
          err instanceof Error ? err.message : "An unknown error occurred.",
        variant: "destructive",
      });
    },
    onSuccess: (data, variables, context) => {
      console.log("Unassignment successful:", data);
      queryClient.invalidateQueries({ queryKey: ["leads"] });

      const { leadIds } = variables;
      const leadCount = leadIds.length;
      const leadText = leadCount === 1 ? "lead" : "leads";

      // Get user information from context
      const leadsByUser = context?.leadsByUser || {};
      const userEntries = Object.values(leadsByUser);

      let description = "";

      if (userEntries.length === 0) {
        description = `${leadCount} ${leadText} unassigned (were not assigned to anyone)`;
      } else if (userEntries.length === 1) {
        const { user, count } = userEntries[0];
        const userFullName = `${user.firstName} ${user.lastName}`;
        const countText = count === 1 ? "lead" : "leads";
        description = `${count} ${countText} unassigned from ${userFullName}`;
      } else {
        // Multiple users
        const userNames = userEntries.map(({ user, count }) => {
          const userFullName = `${user.firstName} ${user.lastName}`;
          const countText = count === 1 ? "lead" : "leads";
          return `${count} ${countText} from ${userFullName}`;
        });
        description = `${leadCount} ${leadText} unassigned: ${userNames.join(", ")}`;
      }

      toast({
        title: "Leads Unassigned Successfully",
        description,
        variant: "success",
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
