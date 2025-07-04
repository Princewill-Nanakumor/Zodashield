// src/app/components/dashboardComponents/LeadsPageContent.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useMemo, useCallback, Suspense } from "react";
import { Loader2, Users, Globe } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useLeadsStore } from "@/stores/leadsStore";
import LeadsTable from "@/components/dashboardComponents/LeadsTable";
import { AssignLeadsDialog } from "@/components/dashboardComponents/AssignLeadsDialog";
import { FilterControls } from "@/components/dashboardComponents/FilterControls";
import { BulkActions } from "@/components/dashboardComponents/BulkActions";
import EmptyState from "@/components/dashboardComponents/EmptyState";
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

const USER_ROLES = {
  ADMIN: "ADMIN",
} as const;

// Utility functions
const getAssignedUserId = (assignedTo: Lead["assignedTo"]): string | null => {
  if (!assignedTo) return null;
  if (typeof assignedTo === "string") return assignedTo;
  if (assignedTo && typeof assignedTo === "object") {
    const assignedToObj = assignedTo as Record<string, unknown>;
    return (
      (assignedToObj.id as string) || (assignedToObj._id as string) || null
    );
  }
  return null;
};

const filterLeadsByUser = (leads: Lead[], filterByUser: string): Lead[] => {
  if (filterByUser === "all") return leads;
  if (filterByUser === "unassigned") {
    return leads.filter((lead) => !getAssignedUserId(lead.assignedTo));
  }
  return leads.filter(
    (lead) => getAssignedUserId(lead.assignedTo) === filterByUser
  );
};

const filterLeadsByCountry = (
  leads: Lead[],
  filterByCountry: string
): Lead[] => {
  if (!filterByCountry || filterByCountry === "all") return leads;
  return leads.filter(
    (lead) => lead.country?.toLowerCase() === filterByCountry.toLowerCase()
  );
};

const getAssignedLeadsCount = (leads: Lead[]): number => {
  return leads.filter((lead) => !!getAssignedUserId(lead.assignedTo)).length;
};

const FilterSkeleton = () => (
  <div className="flex items-center gap-3 animate-pulse">
    <div className="w-[180px] h-10 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
    <div className="w-[200px] h-10 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
  </div>
);

const TableSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div className="animate-pulse">
      {/* Table header skeleton */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      </div>

      {/* Table rows skeleton */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="px-6 py-4 border-b border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ErrorBoundary = ({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback: React.ReactNode;
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) return <>{fallback}</>;

  try {
    return <>{children}</>;
  } catch {
    setHasError(true);
    return <>{fallback}</>;
  }
};

// Simple Country Filter Component - replaces Radix UI Select
const CountryFilter = ({
  value,
  onChange,
  countries,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  countries: string[];
  disabled: boolean;
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    className="w-[180px] h-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
  >
    <option value="all">All Countries</option>
    {countries.map((country) => (
      <option key={country} value={country}>
        {country.charAt(0).toUpperCase() + country.slice(1)}
      </option>
    ))}
  </select>
);

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

  const [uiState, setUiState] = useState({
    isDialogOpen: false,
    isUnassignDialogOpen: false,
    selectedUser: "",
    filterByCountry: "all",
  });

  const handleLeadUpdate = useCallback(async (updatedLead: Lead) => {
    console.log("Lead updated:", updatedLead);
    return true;
  }, []);

  const availableCountries = useMemo(() => {
    const countrySet = new Set<string>();
    leads.forEach((lead) => {
      if (lead.country?.trim()) {
        countrySet.add(lead.country.toLowerCase());
      }
    });
    return Array.from(countrySet).sort();
  }, [leads]);

  const filteredLeads = useMemo(() => {
    let filtered = leads;

    if (filterByUser !== "all") {
      filtered = filterLeadsByUser(filtered, filterByUser);
    }

    if (uiState.filterByCountry !== "all") {
      filtered = filterLeadsByCountry(filtered, uiState.filterByCountry);
    }

    return filtered;
  }, [leads, filterByUser, uiState.filterByCountry]);

  const counts = useMemo(
    () => ({
      total: leads.length,
      filtered: filteredLeads.length,
      assigned: getAssignedLeadsCount(selectedLeads),
      countries: availableCountries.length,
    }),
    [
      leads.length,
      filteredLeads.length,
      selectedLeads,
      availableCountries.length,
    ]
  );

  const isLoading = isLoadingLeads || isLoadingUsers;

  const shouldShowLoading = isLoadingLeads || isLoadingUsers;
  const showEmptyState =
    !shouldShowLoading &&
    !isLoading &&
    filteredLeads.length === 0 &&
    leads.length === 0;

  const handleAssignLeads = useCallback(async () => {
    if (selectedLeads.length === 0 || !uiState.selectedUser) return;

    try {
      await assignLeads({
        leadIds: selectedLeads.map((l) => l._id),
        userId: uiState.selectedUser,
      });
      setSelectedLeads([]);
      setUiState((prev) => ({
        ...prev,
        isDialogOpen: false,
        selectedUser: "",
      }));
    } catch (error) {
      console.error("Assignment error:", error);
      // Error is already handled in the mutation
    }
  }, [selectedLeads, uiState.selectedUser, assignLeads, setSelectedLeads]);

  const handleUnassignLeads = useCallback(async () => {
    const leadsToUnassign = selectedLeads.filter(
      (lead) => !!getAssignedUserId(lead.assignedTo)
    );

    if (leadsToUnassign.length === 0) {
      toast({
        title: "No action needed",
        description: "All selected leads are already unassigned.",
      });
      setUiState((prev) => ({ ...prev, isUnassignDialogOpen: false }));
      return;
    }

    try {
      await unassignLeads({ leadIds: leadsToUnassign.map((l) => l._id) });
      setSelectedLeads([]);
      setUiState((prev) => ({ ...prev, isUnassignDialogOpen: false }));
    } catch (error) {
      console.error("Unassignment error:", error);
      // Error is already handled in the mutation
    }
  }, [selectedLeads, unassignLeads, setSelectedLeads, toast]);

  const handleSelectionChange = useCallback(
    (newSelectedLeads: Lead[]) => setSelectedLeads(newSelectedLeads),
    [setSelectedLeads]
  );

  const handleCountryFilterChange = useCallback((country: string) => {
    setUiState((prev) => ({ ...prev, filterByCountry: country }));
  }, []);

  const handleFilterChange = useCallback(
    (value: string) => setFilterByUser(value),
    [setFilterByUser]
  );

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
      {/* Header */}
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

      {/* Filter Controls */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 px-8 py-4 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ErrorBoundary
              fallback={
                <div className="text-red-500">Bulk actions failed to load</div>
              }
            >
              <BulkActions
                selectedLeads={selectedLeads}
                hasAssignedLeads={hasAssignedLeads}
                assignedLeadsCount={counts.assigned}
                isUpdating={isAssigning || isUnassigning}
                onAssign={() =>
                  setUiState((prev) => ({ ...prev, isDialogOpen: true }))
                }
                onUnassign={() =>
                  setUiState((prev) => ({
                    ...prev,
                    isUnassignDialogOpen: true,
                  }))
                }
              />
            </ErrorBoundary>
          </div>

          <div className="flex items-center gap-3">
            <ErrorBoundary fallback={<FilterSkeleton />}>
              <Suspense fallback={<FilterSkeleton />}>
                {/* Simple Country Filter */}
                <CountryFilter
                  value={uiState.filterByCountry}
                  onChange={handleCountryFilterChange}
                  countries={availableCountries}
                  disabled={isLoading}
                />

                {/* Simple User Filter */}
                <FilterControls
                  filterByUser={filterByUser}
                  onFilterChange={handleFilterChange}
                  users={users}
                  isLoading={isLoadingUsers}
                />
              </Suspense>
            </ErrorBoundary>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-8 py-6">
        <ErrorBoundary
          fallback={<div className="text-red-500">Table failed to load</div>}
        >
          <Suspense fallback={<TableSkeleton />}>
            {shouldShowLoading ? (
              <TableSkeleton />
            ) : showEmptyState ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <EmptyState
                  filterByUser={filterByUser}
                  filterByCountry={uiState.filterByCountry}
                  users={users}
                />
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <LeadsTable
                  leads={filteredLeads}
                  onLeadUpdated={handleLeadUpdate}
                  isLoading={isLoading}
                  selectedLeads={selectedLeads}
                  users={users}
                  onSelectionChange={handleSelectionChange}
                />
              </div>
            )}
          </Suspense>
        </ErrorBoundary>
      </div>

      {/* Dialogs */}
      <AssignLeadsDialog
        isOpen={uiState.isDialogOpen}
        onClose={() =>
          setUiState((prev) => ({
            ...prev,
            isDialogOpen: false,
            selectedUser: "",
          }))
        }
        users={users.filter((user) => user.status === "ACTIVE")}
        selectedUser={uiState.selectedUser}
        setSelectedUser={(user) =>
          setUiState((prev) => ({ ...prev, selectedUser: user }))
        }
        isLoadingUsers={isLoadingUsers}
        isAssigning={isAssigning}
        onAssign={handleAssignLeads}
        onUnassign={handleUnassignLeads}
        selectedLeads={selectedLeads}
      />

      <AlertDialog
        open={uiState.isUnassignDialogOpen}
        onOpenChange={(open) =>
          setUiState((prev) => ({ ...prev, isUnassignDialogOpen: open }))
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Unassign {counts.assigned} lead{counts.assigned > 1 ? "s" : ""}?
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
              disabled={isUnassigning}
            >
              {isUnassigning ? (
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
