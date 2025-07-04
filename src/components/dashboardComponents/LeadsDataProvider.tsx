"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { useToast } from "@/components/ui/use-toast";
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
  source: LeadSource;
  status?: string;
  country: string;
  assignedTo?:
    | string
    | { id: string; firstName: string; lastName: string }
    | null;
  createdAt: string;
  updatedAt: string;
  comments?: string;
}

interface LeadsDataProviderProps {
  children: (data: {
    leads: Lead[];
    allLeads: Lead[];
    users: User[];
    isLoadingLeads: boolean;
    isLoadingUsers: boolean;
    filterByUser: string;
    setFilterByUser: (value: string) => void;
    selectedLeads: Lead[];
    setSelectedLeads: (leads: Lead[]) => void;
    handleAssignLeads: (userId: string) => Promise<void>;
    handleUnassignLeads: () => Promise<void>;
    handleLeadUpdate: (updatedLead: Lead) => Promise<boolean>;
  }) => React.ReactNode;
  isAdmin: boolean;
  initialFilter: string;
}

const LeadsDataProvider: React.FC<LeadsDataProviderProps> = ({
  children,
  isAdmin,
  initialFilter,
}) => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [filterByUser, setFilterByUser] = useState(initialFilter);
  const [selectedLeads, setSelectedLeads] = useState<Lead[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Use ref to store toast function to avoid dependency issues
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const fetchLeads = useCallback(
    async (currentUsers: User[]) => {
      if (isLoadingLeads) return; // Prevent concurrent fetches

      try {
        setIsLoadingLeads(true);
        const response = await fetch("/api/leads/all");
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch leads");
        }

        const data: ApiLead[] = await response.json();

        const formattedLeads = data.map((apiLead): Lead => {
          let assignedToObject:
            | Pick<User, "id" | "firstName" | "lastName">
            | undefined = undefined;

          if (
            typeof apiLead.assignedTo === "object" &&
            apiLead.assignedTo !== null
          ) {
            assignedToObject = apiLead.assignedTo;
          } else if (typeof apiLead.assignedTo === "string") {
            const user = currentUsers.find((u) => u.id === apiLead.assignedTo);
            if (user) {
              assignedToObject = {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
              };
            } else {
              console.warn(
                "⚠️ User not found for assignedTo:",
                apiLead.assignedTo,
                "Available users:",
                currentUsers.map((u) => u.id)
              );
            }
          }

          const formattedLead = {
            ...apiLead,
            _id: apiLead._id || apiLead.id || "",
            id: apiLead.id || apiLead._id,
            name:
              apiLead.name || `${apiLead.firstName} ${apiLead.lastName}`.trim(),
            status: apiLead.status || "NEW",
            assignedTo: assignedToObject,
          } as Lead;

          return formattedLead;
        });

        console.log(" Formatted leads:", {
          total: formattedLeads.length,
          withAssignedTo: formattedLeads.filter((lead) => lead.assignedTo)
            .length,
          withoutAssignedTo: formattedLeads.filter((lead) => !lead.assignedTo)
            .length,
          sampleAssignedTo: formattedLeads
            .filter((lead) => lead.assignedTo)
            .slice(0, 3)
            .map((lead) => ({
              id: lead._id,
              assignedTo: lead.assignedTo,
            })),
        });

        setLeads(formattedLeads);
      } catch (error) {
        console.error("Error fetching leads:", error);
        toastRef.current({
          title: "Error",
          description: "Failed to fetch leads",
          variant: "destructive",
        });
      } finally {
        setIsLoadingLeads(false);
      }
    },
    [isLoadingLeads]
  );

  // Initialize data only once
  useEffect(() => {
    if (isInitialized) return;

    const initializeData = async () => {
      if (isAdmin) {
        setIsLoadingUsers(true);
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
          // Only fetch leads after users are loaded
          await fetchLeads(activeUsers);
        } catch (e) {
          console.error("Error initializing data:", e);
          toastRef.current({
            title: "Error loading users",
            description:
              e instanceof Error ? e.message : "An unknown error occurred.",
            variant: "destructive",
          });
          // Don't fetch leads with empty users array - this causes the race condition
          // Instead, just set leads to empty array directly
          setLeads([]);
        } finally {
          setIsLoadingUsers(false);
        }
      } else {
        // For non-admin users, fetch leads without user mapping
        await fetchLeads([]);
      }
      setIsInitialized(true);
    };

    initializeData();
  }, [isAdmin, fetchLeads, isInitialized]);

  const handleLeadUpdate = useCallback(
    async (updatedLead: Lead): Promise<boolean> => {
      try {
        setLeads((prevLeads) =>
          prevLeads.map((lead) =>
            lead._id === updatedLead._id ? updatedLead : lead
          )
        );
        return true;
      } catch (error) {
        console.error("Error optimistically updating lead state:", error);
        return false;
      }
    },
    []
  );

  const handleAssignLeads = useCallback(
    async (userId: string) => {
      if (selectedLeads.length === 0) return;

      const user = users.find((u) => u.id === userId);
      if (!user) {
        toastRef.current({
          title: "Error",
          description: "Could not find the selected user.",
          variant: "destructive",
        });
        throw new Error("User not found");
      }

      const originalLeads = [...leads];
      setLeads((prevLeads) =>
        prevLeads.map((lead) => {
          if (selectedLeads.some((sl) => sl._id === lead._id)) {
            return {
              ...lead,
              assignedTo: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
              },
            };
          }
          return lead;
        })
      );
      setSelectedLeads([]);

      try {
        // Send the current status for each lead
        const leadsToAssign = selectedLeads.map((lead) => ({
          _id: lead._id,
          status: lead.status,
          // add other fields if needed
        }));

        const response = await fetch("/api/leads/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leads: leadsToAssign, userId }),
        });

        if (!response.ok) {
          throw new Error(
            (await response.json()).message || "Failed to assign leads."
          );
        }

        toastRef.current({
          title: "Success",
          description: `Assigned ${selectedLeads.length} lead(s) to ${user.firstName}.`,
          variant: "success",
        });
        await fetchLeads(users);
      } catch (error) {
        setLeads(originalLeads);
        console.error("Failed to assign leads on server", error);
        toastRef.current({
          title: "Assignment Failed",
          description:
            error instanceof Error
              ? error.message
              : "An unknown error occurred.",
          variant: "destructive",
        });
        throw error;
      }
    },
    [leads, selectedLeads, users, fetchLeads]
  );

  const handleUnassignLeads = useCallback(async () => {
    const leadsToUnassign = selectedLeads.filter((lead) => lead.assignedTo);
    if (leadsToUnassign.length === 0) {
      toastRef.current({
        title: "No action needed",
        description: "No assigned leads were selected.",
      });
      return;
    }

    const originalLeads = [...leads];
    setLeads((prev) =>
      prev.map((lead) => {
        if (leadsToUnassign.some((ltu) => ltu._id === lead._id)) {
          const rest = { ...lead };
          delete rest.assignedTo;
          return rest;
        }
        return lead;
      })
    );
    setSelectedLeads([]);

    try {
      const leadIds = leadsToUnassign.map((l) => l._id);
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

      toastRef.current({
        title: "Success",
        description: `Unassigned ${leadsToUnassign.length} lead(s).`,
        variant: "success",
      });
      await fetchLeads(users);
    } catch (error) {
      setLeads(originalLeads);
      console.error("Failed to unassign leads", error);
      toastRef.current({
        title: "Unassignment Failed",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
      throw error;
    }
  }, [leads, selectedLeads, users, fetchLeads]);

  const filteredLeads = useMemo(() => {
    console.log(" Filtering leads:", {
      totalLeads: leads.length,
      filterByUser,
      leadsWithAssignedTo: leads.filter((lead) => lead.assignedTo).length,
      leadsWithoutAssignedTo: leads.filter((lead) => !lead.assignedTo).length,
    });

    if (filterByUser === "unassigned") {
      const unassigned = leads.filter((lead) => !lead.assignedTo);
      console.log("📋 Unassigned leads:", unassigned.length);
      return unassigned;
    }
    if (filterByUser === "all") {
      console.log(" All leads:", leads.length);
      return leads;
    }

    // Helper function to get assigned user ID
    const getAssignedUserId = (
      assignedTo:
        | string
        | { id: string; firstName: string; lastName: string }
        | null
        | undefined
    ) => {
      if (!assignedTo) return null;
      return typeof assignedTo === "string" ? assignedTo : assignedTo.id;
    };

    const assigned = leads.filter((lead) => {
      const assignedUserId = getAssignedUserId(lead.assignedTo);
      return assignedUserId === filterByUser;
    });

    console.log(" Assigned leads for user", filterByUser, ":", assigned.length);
    return assigned;
  }, [leads, filterByUser]);

  return children({
    leads: filteredLeads,
    allLeads: leads,
    users,
    isLoadingLeads,
    isLoadingUsers,
    filterByUser,
    setFilterByUser,
    selectedLeads,
    setSelectedLeads,
    handleAssignLeads,
    handleUnassignLeads,
    handleLeadUpdate,
  });
};

export default LeadsDataProvider;
