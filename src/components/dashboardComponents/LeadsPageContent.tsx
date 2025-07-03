"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useMemo, useCallback } from "react";
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
import useUrlFilterSync from "@/hooks/useUrlFilterSync";
import useLeadUpdate from "@/hooks/useLeadUpdate";

const USER_ROLES = {
  ADMIN: "ADMIN",
} as const;

// Clean utility function with no logging
const getAssignedUserId = (assignedTo: Lead["assignedTo"]): string | null => {
  if (!assignedTo) return null;

  if (typeof assignedTo === "string") {
    return assignedTo;
  }

  if (assignedTo && typeof assignedTo === "object") {
    const assignedToObj = assignedTo as Record<string, unknown>;

    if (assignedToObj.id && typeof assignedToObj.id === "string") {
      return assignedToObj.id;
    }

    if (assignedToObj._id && typeof assignedToObj._id === "string") {
      return assignedToObj._id;
    }

    return null;
  }

  return null;
};

const filterLeadsByUser = (leads: Lead[], filterByUser: string): Lead[] => {
  switch (filterByUser) {
    case "unassigned":
      return leads.filter((lead) => !getAssignedUserId(lead.assignedTo));

    case "all":
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
  const { toast } = useToast();

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

  // Use Zustand store for selected leads and filter
  const { selectedLeads, setSelectedLeads, filterByUser, setFilterByUser } =
    useLeadsStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUnassignDialogOpen, setIsUnassignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("");

  // Use extracted hooks
  const { isInitialized, handleFilterChange } = useUrlFilterSync(
    users,
    isLoadingUsers,
    filterByUser,
    setFilterByUser
  );

  const { handleLeadUpdate, isUpdating } = useLeadUpdate(
    leads,
    () => {} // No need to sync back since we're using useLeads directly
  );

  // Memoized filtered leads - Use leads directly from useLeads hook
  const filteredLeads = useMemo(() => {
    if (!isInitialized) {
      return leads;
    }

    return filterLeadsByUser(leads, filterByUser);
  }, [leads, filterByUser, isInitialized]);

  const handleAssignLeads = useCallback(async () => {
    if (selectedLeads.length === 0 || !selectedUser) return;

    try {
      const leadsToAssign = selectedLeads;
      const assignmentData = {
        leadIds: leadsToAssign.map((l) => l._id),
        userId: selectedUser,
      };

      await assignLeads(assignmentData);

      setSelectedLeads([]);
      setIsDialogOpen(false);
      setSelectedUser("");

      toast({
        title: "Success",
        description: `${leadsToAssign.length} lead${leadsToAssign.length > 1 ? "s" : ""} assigned successfully.`,
        variant: "success",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to assign leads. Please try again.",
        variant: "destructive",
      });
    }
  }, [selectedLeads, selectedUser, assignLeads, setSelectedLeads, toast]);

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
    }
  }, [selectedLeads, unassignLeads, setSelectedLeads, toast]);

  // Handle selection change
  const handleSelectionChange = useCallback(
    (newSelectedLeads: Lead[]) => {
      setSelectedLeads(newSelectedLeads);
    },
    [setSelectedLeads]
  );

  // Computed values
  const isLoading = isLoadingLeads || isLoadingUsers || isUpdating;
  const hasAssignedLeads = selectedLeads.some(
    (lead) => !!getAssignedUserId(lead.assignedTo)
  );
  const assignedLeadsCount = getAssignedLeadsCount(selectedLeads);

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
            isLoading={isLoadingUsers}
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
              onSelectionChange={handleSelectionChange}
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
