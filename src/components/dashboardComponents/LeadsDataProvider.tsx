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
    searchQuery: string;
    setSearchQuery: (query: string) => void;
  }) => React.ReactNode;
  isAdmin: boolean;
  initialFilter: string;
  searchQuery?: string;
}

const LeadsDataProvider: React.FC<LeadsDataProviderProps> = ({
  children,
  isAdmin,
  initialFilter,
  searchQuery = "",
}) => {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [filterByUser, setFilterByUser] = useState(initialFilter);
  const [selectedLeads, setSelectedLeads] = useState<Lead[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [internalSearchQuery, setInternalSearchQuery] = useState(searchQuery);

  // Use ref to store toast function to avoid dependency issues
  const toastRef = useRef(toast);
  toastRef.current = toast;

  // Ref to prevent concurrent fetches
  const fetchingRef = useRef(false);

  // Sync external searchQuery with internal state
  useEffect(() => {
    setInternalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Search function with memoization
  const searchLeads = useCallback((leads: Lead[], query: string): Lead[] => {
    if (!query.trim()) return leads;

    const searchTerm = query.toLowerCase().trim();

    return leads.filter((lead) => {
      const fullName = `${lead.firstName} ${lead.lastName}`.toLowerCase();
      const email = lead.email.toLowerCase();
      const phone = (lead.phone || "").toLowerCase();

      return (
        fullName.includes(searchTerm) ||
        email.includes(searchTerm) ||
        phone.includes(searchTerm)
      );
    });
  }, []);

  const fetchLeads = useCallback(async (currentUsers: User[]) => {
    // Prevent concurrent fetches
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      setIsLoadingLeads(true);
      const response = await fetch("/api/leads/all", {
        credentials: "include",
      });
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
      fetchingRef.current = false;
    }
  }, []);

  // Initialize data only once
  useEffect(() => {
    if (isInitialized) return;

    const initializeData = async () => {
      if (isAdmin) {
        setIsLoadingUsers(true);
        try {
          const res = await fetch("/api/users", {
            credentials: "include",
          });
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
          await fetchLeads(activeUsers);
        } catch (e) {
          console.error("Error initializing data:", e);
          toastRef.current({
            title: "Error loading users",
            description:
              e instanceof Error ? e.message : "An unknown error occurred.",
            variant: "destructive",
          });
          setLeads([]);
        } finally {
          setIsLoadingUsers(false);
        }
      } else {
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

  // ⚡ OPTIMIZED ASSIGNMENT FUNCTION
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

      // Store original state for rollback
      const originalLeads = [...leads];
      const originalSelectedLeads = [...selectedLeads];

      // ⚡ INSTANT UI UPDATE - User sees immediate feedback
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

      // Clear selection immediately
      setSelectedLeads([]);

      // Show success toast immediately for better UX
      toastRef.current({
        title: "Assigning leads...",
        description: `Assigning ${originalSelectedLeads.length} lead(s) to ${user.firstName}.`,
        variant: "default",
      });

      try {
        // Send the assignment request
        const leadsToAssign = originalSelectedLeads.map((lead) => ({
          _id: lead._id,
          status: lead.status,
        }));

        const response = await fetch("/api/leads/assign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leads: leadsToAssign, userId }),
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(
            (await response.json()).message || "Failed to assign leads."
          );
        }

        // ✅ SUCCESS - Update success toast
        toastRef.current({
          title: "Success!",
          description: `Successfully assigned ${originalSelectedLeads.length} lead(s) to ${user.firstName}.`,
          variant: "success",
        });

        // 🔄 BACKGROUND REFRESH - Sync with server after delay
        setTimeout(() => {
          if (!fetchingRef.current) {
            fetchLeads(users);
          }
        }, 2000);
      } catch (error) {
        // ❌ ROLLBACK - Revert optimistic update on error
        setLeads(originalLeads);
        setSelectedLeads(originalSelectedLeads);

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

  // ⚡ OPTIMIZED UNASSIGNMENT FUNCTION
  const handleUnassignLeads = useCallback(async () => {
    const leadsToUnassign = selectedLeads.filter((lead) => lead.assignedTo);
    if (leadsToUnassign.length === 0) {
      toastRef.current({
        title: "No action needed",
        description: "No assigned leads were selected.",
      });
      return;
    }

    // Store original state for rollback
    const originalLeads = [...leads];
    const originalSelectedLeads = [...selectedLeads];

    // ⚡ INSTANT UI UPDATE
    setLeads((prev) =>
      prev.map((lead) => {
        if (leadsToUnassign.some((ltu) => ltu._id === lead._id)) {
          return {
            ...lead,
            assignedTo: null, // Clear assignment
          };
        }
        return lead;
      })
    );

    // Clear selection immediately
    setSelectedLeads([]);

    // Show immediate feedback
    toastRef.current({
      title: "Unassigning leads...",
      description: `Unassigning ${leadsToUnassign.length} lead(s).`,
      variant: "default",
    });

    try {
      const leadIds = leadsToUnassign.map((l) => l._id);
      const response = await fetch("/api/leads/unassign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(
          (await response.json()).message || "Failed to unassign leads."
        );
      }

      // ✅ SUCCESS
      toastRef.current({
        title: "Success!",
        description: `Successfully unassigned ${leadsToUnassign.length} lead(s).`,
        variant: "success",
      });

      // 🔄 BACKGROUND REFRESH
      setTimeout(() => {
        if (!fetchingRef.current) {
          fetchLeads(users);
        }
      }, 2000);
    } catch (error) {
      // ❌ ROLLBACK
      setLeads(originalLeads);
      setSelectedLeads(originalSelectedLeads);

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

  // Memoized filtered leads for better performance
  const filteredLeads = useMemo(() => {
    let filtered = leads;

    // Apply search filter first
    if (internalSearchQuery.trim()) {
      filtered = searchLeads(filtered, internalSearchQuery);
    }

    // Apply user filter
    if (filterByUser === "unassigned") {
      filtered = filtered.filter((lead) => !lead.assignedTo);
    } else if (filterByUser !== "all") {
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

      filtered = filtered.filter((lead) => {
        const assignedUserId = getAssignedUserId(lead.assignedTo);
        return assignedUserId === filterByUser;
      });
    }

    return filtered;
  }, [leads, filterByUser, internalSearchQuery, searchLeads]);

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
    searchQuery: internalSearchQuery,
    setSearchQuery: setInternalSearchQuery,
  });
};

export default LeadsDataProvider;
