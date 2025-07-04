"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useMemo, useCallback, useEffect } from "react";
import { Loader2, Users, Globe } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lead } from "@/types/leads";
import useUrlFilterSync from "@/hooks/useUrlFilterSync";
import useLeadUpdate from "@/hooks/useLeadUpdate";

const USER_ROLES = {
  ADMIN: "ADMIN",
} as const;

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

const filterLeadsByCountry = (
  leads: Lead[],
  filterByCountry: string
): Lead[] => {
  if (!filterByCountry || filterByCountry === "all") {
    return leads;
  }

  return leads.filter(
    (lead) => lead.country?.toLowerCase() === filterByCountry.toLowerCase()
  );
};

const getAssignedLeadsCount = (leads: Lead[]): number => {
  return leads.filter((lead) => !!getAssignedUserId(lead.assignedTo)).length;
};

const LeadsPageContent: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

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

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUnassignDialogOpen, setIsUnassignDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [isDataReady, setIsDataReady] = useState(false);
  const [filterByCountry, setFilterByCountry] = useState<string>("all");

  const { isInitialized, handleFilterChange } = useUrlFilterSync(
    users,
    isLoadingUsers,
    filterByUser,
    setFilterByUser
  );

  const { handleLeadUpdate, isUpdating } = useLeadUpdate(leads, () => {});

  // Get unique countries from leads
  const availableCountries = useMemo(() => {
    if (!isDataReady) return [];

    const countries = leads
      .map((lead) => lead.country)
      .filter(
        (country): country is string =>
          country !== undefined && country !== null && country.trim() !== ""
      )
      .map((country) => country.toLowerCase())
      .filter((country, index, arr) => arr.indexOf(country) === index)
      .sort();

    return countries;
  }, [leads, isDataReady]);

  // Memoized filtered leads with proper loading state handling
  const filteredLeads = useMemo(() => {
    // Don't filter if data isn't ready yet
    if (!isDataReady || !isInitialized) {
      return [];
    }

    // First filter by user
    let filtered = filterLeadsByUser(leads, filterByUser);

    // Then filter by country
    filtered = filterLeadsByCountry(filtered, filterByCountry);

    return filtered;
  }, [leads, filterByUser, filterByCountry, isInitialized, isDataReady]);

  // Memoized counts to prevent unnecessary recalculations
  const counts = useMemo(() => {
    if (!isDataReady) {
      return {
        total: 0,
        filtered: 0,
        assigned: 0,
        countries: 0,
      };
    }

    return {
      total: leads.length,
      filtered: filteredLeads.length,
      assigned: getAssignedLeadsCount(selectedLeads),
      countries: availableCountries.length,
    };
  }, [
    leads.length,
    filteredLeads.length,
    selectedLeads,
    availableCountries.length,
    isDataReady,
  ]);

  // Determine if we should show loading states
  const isLoading = isLoadingLeads || isLoadingUsers || isUpdating;
  const isInitialLoading = isLoadingLeads && leads.length === 0;
  const shouldShowLoading = isInitialLoading || !isDataReady;

  // Set data ready state when initial load completes
  useEffect(() => {
    if (!isLoadingLeads && !isLoadingUsers && isInitialized) {
      setIsDataReady(true);
    }
  }, [isLoadingLeads, isLoadingUsers, isInitialized]);

  // Reset data ready state when starting a new load
  useEffect(() => {
    if (isLoadingLeads || isLoadingUsers) {
      setIsDataReady(false);
    }
  }, [isLoadingLeads, isLoadingUsers]);

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

  const handleSelectionChange = useCallback(
    (newSelectedLeads: Lead[]) => {
      setSelectedLeads(newSelectedLeads);
    },
    [setSelectedLeads]
  );

  const handleCountryFilterChange = useCallback((country: string) => {
    setFilterByCountry(country);
  }, []);

  const hasAssignedLeads = selectedLeads.some(
    (lead) => !!getAssignedUserId(lead.assignedTo)
  );

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
    <div className="flex flex-col h-full bg-background dark:bg-gray-900">
      {/* Main Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              Leads Management
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage and track all your leads in one centralized dashboard
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Total Leads Badge */}
            {shouldShowLoading ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Loading...
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                {counts.total.toLocaleString()} Total Leads
              </span>
            )}

            {/* Filtered Leads Badge */}
            {shouldShowLoading ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Loading...
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300">
                {counts.filtered.toLocaleString()} Filtered
              </span>
            )}

            {/* Countries Badge */}
            {shouldShowLoading ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Loading...
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <Globe className="h-3 w-3 mr-1" />
                {counts.countries} Countries
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Filter Controls */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 px-8 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BulkActions
              selectedLeads={selectedLeads}
              hasAssignedLeads={hasAssignedLeads}
              assignedLeadsCount={counts.assigned}
              isUpdating={isUpdating}
              onAssign={() => setIsDialogOpen(true)}
              onUnassign={() => setIsUnassignDialogOpen(true)}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Country Filter */}
            <Select
              value={filterByCountry}
              onValueChange={handleCountryFilterChange}
              disabled={shouldShowLoading}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Countries">
                  {shouldShowLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </div>
                  ) : filterByCountry === "all" ? (
                    "All Countries"
                  ) : (
                    filterByCountry.charAt(0).toUpperCase() +
                    filterByCountry.slice(1)
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {availableCountries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country.charAt(0).toUpperCase() + country.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <FilterControls
              filterByUser={filterByUser}
              onFilterChange={handleFilterChange}
              users={users}
              isLoading={isLoadingUsers}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <LoadingState isLoading={shouldShowLoading}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {!shouldShowLoading && filteredLeads.length === 0 ? (
              <EmptyState
                filterByUser={filterByUser}
                filterByCountry={filterByCountry}
                users={users}
              />
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
      </div>

      {/* Dialogs */}
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
              Unassign {counts.assigned} lead
              {counts.assigned > 1 ? "s" : ""}?
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
