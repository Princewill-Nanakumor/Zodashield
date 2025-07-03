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
import useDataSync from "@/hooks/useDataSync";
import useLeadUpdate from "@/hooks/useLeadUpdate";

const USER_ROLES = {
  ADMIN: "ADMIN",
} as const;

// Utility functions
const getAssignedUserId = (assignedTo: Lead["assignedTo"]): string | null => {
  console.log("getAssignedUserId called with:", assignedTo);

  if (!assignedTo) {
    console.log("assignedTo is null/undefined, returning null");
    return null;
  }

  if (typeof assignedTo === "string") {
    console.log("assignedTo is string:", assignedTo);
    return assignedTo;
  }

  if (assignedTo && typeof assignedTo === "object" && "id" in assignedTo) {
    console.log("assignedTo is object with id:", assignedTo.id);
    return assignedTo.id;
  }

  console.log("assignedTo is object but no id found:", assignedTo);
  return null;
};

const filterLeadsByUser = (leads: Lead[], filterByUser: string): Lead[] => {
  console.log("=== FILTERING LEADS ===");
  console.log("Filter value:", filterByUser);
  console.log("Total leads to filter:", leads.length);

  // Log sample leads for debugging
  const sampleLeads = leads.slice(0, 3);
  console.log(
    "Sample leads:",
    sampleLeads.map((lead) => ({
      id: lead._id,
      name: `${lead.firstName} ${lead.lastName}`,
      assignedTo: lead.assignedTo,
      extractedId: getAssignedUserId(lead.assignedTo),
    }))
  );

  let filteredLeads: Lead[] = [];

  switch (filterByUser) {
    case "unassigned":
      filteredLeads = leads.filter((lead) => {
        const assignedId = getAssignedUserId(lead.assignedTo);
        const isUnassigned = !assignedId;
        console.log(
          `Lead ${lead._id}: assignedId=${assignedId}, isUnassigned=${isUnassigned}`
        );
        return isUnassigned;
      });
      console.log("Unassigned leads found:", filteredLeads.length);
      break;

    case "all":
      filteredLeads = leads;
      console.log("Showing all leads:", filteredLeads.length);
      break;

    default:
      filteredLeads = leads.filter((lead) => {
        const assignedId = getAssignedUserId(lead.assignedTo);
        const matches = assignedId === filterByUser;
        console.log(
          `Lead ${lead._id}: assignedId=${assignedId}, filterByUser=${filterByUser}, matches=${matches}`
        );
        return matches;
      });
      console.log(
        `User leads found for ${filterByUser}:`,
        filteredLeads.length
      );
      break;
  }

  console.log("Final filtered leads count:", filteredLeads.length);
  console.log("=== END FILTERING ===");

  return filteredLeads;
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

  const {
    selectedLeads,
    setSelectedLeads,
    filterByUser,
    setFilterByUser,
    setLeads,
    setUsers,
    setLoadingLeads,
    setLoadingUsers,
    leads: storeLeads,
  } = useLeadsStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUnassignDialogOpen, setIsUnassignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("");

  // Debug logging
  console.log("=== LEADS PAGE CONTENT DEBUG ===");
  console.log("Hook leads count:", leads.length);
  console.log("Store leads count:", storeLeads.length);
  console.log("Current filterByUser:", filterByUser);
  console.log("Users count:", users.length);
  console.log("Is loading users:", isLoadingUsers);

  // Use extracted hooks
  const { isInitialized, handleFilterChange } = useUrlFilterSync(
    users,
    isLoadingUsers,
    filterByUser,
    setFilterByUser
  );

  useDataSync(
    leads,
    users,
    isLoadingLeads,
    isLoadingUsers,
    setLeads,
    setUsers,
    setLoadingLeads,
    setLoadingUsers
  );

  const displayLeads = storeLeads.length > 0 ? storeLeads : leads;
  const { handleLeadUpdate, isUpdating } = useLeadUpdate(
    displayLeads,
    setLeads
  );

  // Memoized filtered leads - Use store leads if available, otherwise use hook leads
  const filteredLeads = useMemo(() => {
    console.log("=== FILTERED LEADS MEMO ===");
    console.log("isInitialized:", isInitialized);
    console.log("displayLeads count:", displayLeads.length);
    console.log("filterByUser:", filterByUser);

    if (!isInitialized) {
      console.log("Not initialized yet, showing all leads");
      return displayLeads;
    }

    const result = filterLeadsByUser(displayLeads, filterByUser);
    console.log("Filtered result count:", result.length);
    return result;
  }, [displayLeads, filterByUser, isInitialized]);

  const handleAssignLeads = useCallback(async () => {
    if (selectedLeads.length === 0 || !selectedUser) return;

    try {
      const leadsToAssign = selectedLeads.map((selectedLead) => {
        const fullLead = displayLeads.find((l) => l._id === selectedLead._id);
        if (!fullLead) {
          throw new Error(`Lead ${selectedLead._id} not found`);
        }
        return fullLead;
      });

      const assignmentData = {
        leadIds: leadsToAssign.map((l) => l._id),
        userId: selectedUser,
        leadsData: leadsToAssign.map((lead) => ({
          _id: lead._id,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          source: lead.source,
          status: lead.status,
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
    }
  }, [
    selectedLeads,
    selectedUser,
    assignLeads,
    setSelectedLeads,
    toast,
    displayLeads,
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
