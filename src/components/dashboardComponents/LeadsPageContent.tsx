// src/components/dashboardComponents/LeadsPageContent.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useLeadsStore } from "@/stores/leadsStore";
import LeadsTable from "@/components/dashboardComponents/LeadsTable";
import { AssignLeadsDialog } from "@/components/dashboardComponents/AssignLeadsDialog";
import { FilterControls } from "@/components/dashboardComponents/FilterControls";
import { BulkActions } from "@/components/dashboardComponents/BulkActions";
import EmptyState from "@/components/dashboardComponents/EmptyState";
import LoadingState from "@/components/dashboardComponents/LoadingState";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Lead } from "@/types/leads";

// Constants
const FILTER_VALUES = {
  ALL: "all",
  UNASSIGNED: "unassigned",
} as const;

const USER_ROLES = {
  ADMIN: "ADMIN",
} as const;

// Utility functions
const getAssignedUserId = (assignedTo: Lead["assignedTo"]): string | null => {
  if (!assignedTo) return null;
  if (typeof assignedTo === "string") return assignedTo;
  return assignedTo.id || null;
};

const filterLeadsByUser = (leads: Lead[], filterByUser: string): Lead[] => {
  switch (filterByUser) {
    case FILTER_VALUES.UNASSIGNED:
      return leads.filter((lead) => !getAssignedUserId(lead.assignedTo));
    case FILTER_VALUES.ALL:
      return leads;
    default:
      return leads.filter(
        (lead) => getAssignedUserId(lead.assignedTo) === filterByUser
      );
  }
};

const getAssignedLeadsCount = (leads: Lead[]): number => {
  return leads.filter((lead) => !!getAssignedUserId(lead.assignedTo)).length;
};

const LeadsPageContent: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get data and actions from hooks
  const {
    leads,
    users,
    isLoadingLeads,
    isLoadingUsers,
    assignLeads,
    unassignLeads,
    isAssigning,
    isUnassigning,
  } = useLeads();

  const { selectedLeads, setSelectedLeads, filterByUser, setFilterByUser } =
    useLeadsStore();

  // UI state - Simplified state management
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUnassignDialogOpen, setIsUnassignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  // URL sync - Simplified approach with debouncing
  useEffect(() => {
    const urlFilter = searchParams.get("filter");
    if (urlFilter && urlFilter !== filterByUser) {
      setFilterByUser(urlFilter);
    } else if (!urlFilter && filterByUser !== FILTER_VALUES.ALL) {
      setFilterByUser(FILTER_VALUES.ALL);
    }
  }, [searchParams, filterByUser, setFilterByUser]);

  // Update URL when filter changes - with debouncing
  const handleFilterChange = useCallback(
    (newFilter: string) => {
      setFilterByUser(newFilter);

      // Debounce URL updates
      const timeoutId = setTimeout(() => {
        const params = new URLSearchParams(searchParams);
        if (newFilter === FILTER_VALUES.ALL) {
          params.delete("filter");
        } else {
          params.set("filter", newFilter);
        }
        router.push(`${window.location.pathname}?${params.toString()}`, {
          scroll: false,
        });
      }, 300);

      return () => clearTimeout(timeoutId);
    },
    [setFilterByUser, searchParams, router]
  );

  // Memoized filtered leads
  const filteredLeads = useMemo(
    () => filterLeadsByUser(leads, filterByUser),
    [leads, filterByUser]
  );

  // Simplified lead update function that preserves existing data
  const handleLeadUpdate = useCallback(
    async (updatedLead: Lead): Promise<boolean> => {
      try {
        setIsUpdating(true);

        // Find the original lead to preserve existing data
        const originalLead = leads.find((l) => l._id === updatedLead._id);
        if (!originalLead) {
          throw new Error("Original lead not found");
        }

        // Create update data that preserves existing fields
        const updateData: Record<string, unknown> = {
          // Only update fields that have actually changed
          ...(updatedLead.firstName !== originalLead.firstName && {
            firstName: updatedLead.firstName,
          }),
          ...(updatedLead.lastName !== originalLead.lastName && {
            lastName: updatedLead.lastName,
          }),
          ...(updatedLead.email !== originalLead.email && {
            email: updatedLead.email,
          }),
          ...(updatedLead.phone !== originalLead.phone && {
            phone: updatedLead.phone,
          }),
          ...(updatedLead.source !== originalLead.source && {
            source: updatedLead.source,
          }),
          ...(updatedLead.status !== originalLead.status && {
            status: updatedLead.status,
          }),
          ...(updatedLead.country !== originalLead.country && {
            country: updatedLead.country,
          }),
          ...(updatedLead.comments !== originalLead.comments && {
            comments: updatedLead.comments,
          }),
          // Handle assignedTo properly
          ...(updatedLead.assignedTo !== originalLead.assignedTo && {
            assignedTo:
              typeof updatedLead.assignedTo === "string"
                ? updatedLead.assignedTo
                : updatedLead.assignedTo?.id || null,
          }),
          updatedAt: new Date().toISOString(),
        };

        // Remove undefined values
        Object.keys(updateData).forEach(
          (key) => updateData[key] === undefined && delete updateData[key]
        );

        const response = await fetch(`/api/leads/${updatedLead._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("API Error:", errorData);
          throw new Error(
            errorData.error || errorData.message || "Failed to update lead"
          );
        }

        const result = await response.json();
        console.log("Update successful:", result);

        queryClient.invalidateQueries({ queryKey: ["leads"] });

        toast({
          title: "Success",
          description: "Lead updated successfully",
          variant: "success",
        });

        return true;
      } catch (error) {
        console.error("Error updating lead:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to update lead",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [leads, queryClient, toast]
  );

  // Enhanced assignment function that preserves lead data
  const handleAssignLeads = useCallback(async () => {
    if (selectedLeads.length === 0 || !selectedUser) return;

    setIsUpdating(true);
    try {
      // Get the full lead data for each selected lead
      const leadsToAssign = selectedLeads.map((selectedLead) => {
        const fullLead = leads.find((l) => l._id === selectedLead._id);
        if (!fullLead) {
          throw new Error(`Lead ${selectedLead._id} not found`);
        }
        return fullLead;
      });

      // Create assignment data that preserves all lead properties
      const assignmentData = {
        leadIds: leadsToAssign.map((l) => l._id),
        userId: selectedUser,
        // Include all lead data to preserve during assignment
        leadsData: leadsToAssign.map((lead) => ({
          _id: lead._id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          source: lead.source,
          status: lead.status, // Preserve current status
          country: lead.country,
          comments: lead.comments,
          createdAt: lead.createdAt,
          updatedAt: new Date().toISOString(),
        })),
      };

      await assignLeads(assignmentData);

      setSelectedLeads([]);
      setIsDialogOpen(false);
      setSelectedUser("");

      toast({
        title: "Success",
        description: `${leadsToAssign.length} lead${
          leadsToAssign.length > 1 ? "s" : ""
        } assigned successfully.`,
        variant: "success",
      });
    } catch (error) {
      console.error("Error assigning leads:", error);
      toast({
        title: "Error",
        description: "Failed to assign leads. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [
    selectedLeads,
    selectedUser,
    assignLeads,
    setSelectedLeads,
    toast,
    leads,
  ]);

  const handleUnassignLeads = useCallback(async () => {
    const leadsToUnassign = selectedLeads.filter(
      (lead) => !!getAssignedUserId(lead.assignedTo)
    );

    if (leadsToUnassign.length === 0) {
      toast({
        title: "No action needed",
        description: "All selected leads are already unassigned.",
      });
      setIsUnassignDialogOpen(false);
      return;
    }

    setIsUpdating(true);
    try {
      const leadIds = leadsToUnassign.map((l) => l._id);
      const result = await unassignLeads({ leadIds });

      setSelectedLeads([]);
      setIsUnassignDialogOpen(false);

      if (result?.unassignedCount === leadIds.length) {
        toast({
          title: "Success",
          description: `${result.unassignedCount} lead${
            result.unassignedCount > 1 ? "s" : ""
          } unassigned successfully.`,
          variant: "success",
        });
      } else {
        toast({
          title: "Partial success",
          description: `Only ${result.unassignedCount} of ${leadIds.length} selected leads were unassigned.`,
          variant: "success",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to unassign leads. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  }, [selectedLeads, unassignLeads, setSelectedLeads, toast]);

  // Computed values
  const isLoading = isLoadingLeads || isLoadingUsers || isUpdating;
  const hasAssignedLeads = selectedLeads.some(
    (lead) => !!getAssignedUserId(lead.assignedTo)
  );
  const assignedLeadsCount = getAssignedLeadsCount(selectedLeads);

  // Early returns
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 dark:border-white border-t-transparent"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/signin");
    return null;
  }

  if (!session?.user?.role || session.user.role !== USER_ROLES.ADMIN) {
    router.push("/dashboard");
    return null;
  }

  return (
    <div className="flex-1 bg-background dark:bg-gray-900 p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Leads
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage and track all your leads in one place
          </p>
        </div>
        <div className="flex gap-4">
          <FilterControls
            filterByUser={filterByUser}
            onFilterChange={handleFilterChange}
            users={users}
          />
          <BulkActions
            selectedLeads={selectedLeads}
            hasAssignedLeads={hasAssignedLeads}
            assignedLeadsCount={assignedLeadsCount}
            isUpdating={isUpdating}
            onAssign={() => setIsDialogOpen(true)}
            onUnassign={() => setIsUnassignDialogOpen(true)}
          />
        </div>
      </div>

      <LoadingState isLoading={isLoading}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          {filteredLeads.length === 0 ? (
            <EmptyState filterByUser={filterByUser} />
          ) : (
            <LeadsTable
              leads={filteredLeads}
              onLeadUpdated={handleLeadUpdate}
              isLoading={isLoading}
              selectedLeads={selectedLeads}
              users={users}
              onSelectionChange={setSelectedLeads}
            />
          )}
        </div>
      </LoadingState>

      <AssignLeadsDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setSelectedUser("");
        }}
        users={users.filter((user) => user.status === "ACTIVE")}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        isLoadingUsers={isLoadingUsers}
        isAssigning={isAssigning || isUpdating}
        onAssign={handleAssignLeads}
        onUnassign={handleUnassignLeads}
        selectedLeads={selectedLeads}
      />

      <AlertDialog
        open={isUnassignDialogOpen}
        onOpenChange={setIsUnassignDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Unassign {assignedLeadsCount} lead
              {assignedLeadsCount > 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the assignment from the selected leads. They will
              become unassigned and available for reassignment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnassignLeads}
              disabled={isUnassigning || isUpdating}
            >
              {isUnassigning || isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Unassigning...
                </>
              ) : (
                "Yes, Unassign"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LeadsPageContent;
