// src/components/dashboardComponents/LeadsPageContent.tsx
"use client";

import { useCallback, Suspense, useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LeadsTable from "@/components/dashboardComponents/LeadsTable";
import EmptyState from "@/components/dashboardComponents/EmptyState";
import { LeadsHeader } from "./LeadHeader";
import { LeadsFilterControls } from "./LeadFilter";
import { LeadsDialogs } from "./LeadDialog";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import {
  TableSkeleton,
  LoadingSpinner,
  ErrorBoundary,
} from "./LeadsLoadingState";
import { useLeadsPage } from "@/hooks/useLeadsPage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield } from "lucide-react";

const USER_ROLES = {
  ADMIN: "ADMIN",
} as const;

interface LeadsPageContentProps {
  searchQuery?: string;
  isLoading?: boolean;
  setLayoutLoading?: (loading: boolean) => void;
}

// Proper TypeScript interface for subscription data
interface SubscriptionData {
  isOnTrial: boolean;
  trialEndsAt: string | null;
  currentPlan: string | null;
  subscriptionStatus: "active" | "inactive" | "trial" | "expired";
  balance: number;
}

const LeadsPageContent: React.FC<LeadsPageContentProps> = ({
  searchQuery = "",
  isLoading = false,
  setLayoutLoading,
}) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isOnline = useNetworkStatus();

  // Subscription state with proper typing
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);

  // Use useMemo to create a stable reference
  const BYPASS_SUBSCRIPTION_CHECK = useMemo(() => false, []); // Set to false to use real subscription check

  // Check subscription status on mount
  useEffect(() => {
    const checkSubscription = async () => {
      if (BYPASS_SUBSCRIPTION_CHECK) {
        // Simulate no active subscription for testing
        setHasActiveSubscription(false);
        setSubscriptionData({
          isOnTrial: false,
          trialEndsAt: null,
          currentPlan: null,
          subscriptionStatus: "expired",
          balance: 0,
        });
        setSubscriptionLoading(false);
        return;
      }

      try {
        setSubscriptionLoading(true);
        const response = await fetch("/api/subscription/status", {
          credentials: "include",
        });

        if (response.ok) {
          const data: SubscriptionData = await response.json();
          setSubscriptionData(data);

          // Check if user has active subscription or is still in trial period
          const now = new Date();
          const trialEndDate = data.trialEndsAt
            ? new Date(data.trialEndsAt)
            : null;
          const isTrialExpired = trialEndDate && now > trialEndDate;

          // User has active subscription if:
          // 1. They have a paid subscription (active)
          // 2. They're in trial period and trial hasn't expired
          const hasActiveSub =
            data.subscriptionStatus === "active" ||
            (data.subscriptionStatus === "trial" && !isTrialExpired);

          setHasActiveSubscription(hasActiveSub);

          console.log("Subscription check:", {
            subscriptionStatus: data.subscriptionStatus,
            isOnTrial: data.isOnTrial,
            trialEndsAt: data.trialEndsAt,
            trialEndDate: trialEndDate,
            now: now,
            isTrialExpired,
            hasActiveSub,
          });
        } else {
          setHasActiveSubscription(false);
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
        setHasActiveSubscription(false);
      } finally {
        setSubscriptionLoading(false);
      }
    };
    checkSubscription();
  }, [BYPASS_SUBSCRIPTION_CHECK]);

  const {
    leads,
    users,
    isLoadingUsers,
    isAssigning,
    isUnassigning,
    selectedLeads,
    filterByUser,
    uiState,
    setUiState,
    filteredLeads,
    counts,
    shouldShowLoading,
    showEmptyState,
    availableCountries,
    availableStatuses,
    handleAssignLeads,
    handleUnassignLeads,
    handleSelectionChange,
    handleCountryFilterChange,
    handleStatusFilterChange,
    handleFilterChange,
    hasAssignedLeads,
  } = useLeadsPage(searchQuery, setLayoutLoading);

  const handleLeadUpdate = useCallback(async () => {
    return true;
  }, []);

  // Show offline message
  if (!isOnline) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500">
            You are offline. Please check your connection.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return <LoadingSpinner />;
  }

  if (status === "unauthenticated") {
    router.push("/signin");
    return null;
  }

  if (!session?.user?.role || session.user.role !== USER_ROLES.ADMIN) {
    router.push("/dashboard");
    return null;
  }

  // Show skeleton while checking subscription
  if (subscriptionLoading) {
    return <TableSkeleton />;
  }

  // Show subscription required message if no active subscription
  if (!hasActiveSubscription) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-background dark:bg-gray-800 border-1 rounded-lg p-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-800 dark:text-red-200">
              <AlertTriangle className="h-5 w-5" />
              <span>Subscription Required</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2 text-red-700 dark:text-red-300">
              <Shield className="h-4 w-4" />
              <p>
                You need an active subscription to view and manage leads.
                {subscriptionData?.subscriptionStatus === "expired" ||
                (subscriptionData?.trialEndsAt &&
                  new Date() > new Date(subscriptionData.trialEndsAt))
                  ? " Your trial has expired."
                  : " Please subscribe to continue."}
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                onClick={() =>
                  (window.location.href = "/dashboard/subscription")
                }
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Subscribe Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only render the table if subscription is active
  return (
    <div className="flex flex-col h-full bg-background dark:bg-gray-800 border-1 rounded-lg">
      <LeadsHeader shouldShowLoading={shouldShowLoading} counts={counts} />

      <LeadsFilterControls
        selectedLeads={selectedLeads}
        hasAssignedLeads={hasAssignedLeads}
        assignedLeadsCount={counts.assigned}
        isUpdating={isAssigning || isUnassigning}
        onAssign={() => setUiState((prev) => ({ ...prev, isDialogOpen: true }))}
        onUnassign={() =>
          setUiState((prev) => ({
            ...prev,
            isUnassignDialogOpen: true,
          }))
        }
        filterByCountry={uiState.filterByCountry}
        onCountryFilterChange={handleCountryFilterChange}
        filterByStatus={uiState.filterByStatus}
        onStatusFilterChange={handleStatusFilterChange}
        availableCountries={availableCountries}
        availableStatuses={availableStatuses}
        isLoading={isLoading}
        filterByUser={filterByUser}
        onFilterChange={handleFilterChange}
        users={users}
        isLoadingUsers={isLoadingUsers}
      />

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
                  filterByStatus={uiState.filterByStatus}
                  users={users}
                />
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <LeadsTable
                  key={`leads-table-${leads.length}-${filterByUser}-${uiState.filterByCountry}-${uiState.filterByStatus}`}
                  leads={filteredLeads}
                  onLeadUpdated={handleLeadUpdate}
                  isLoading={isLoading}
                  selectedLeads={selectedLeads}
                  users={users}
                  onSelectionChange={handleSelectionChange}
                  searchQuery={uiState.searchQuery}
                  filterByUser={filterByUser}
                  filterByCountry={uiState.filterByCountry}
                  filterByStatus={uiState.filterByStatus}
                />
              </div>
            )}
          </Suspense>
        </ErrorBoundary>
      </div>

      <LeadsDialogs
        isDialogOpen={uiState.isDialogOpen}
        onDialogClose={() =>
          setUiState((prev) => ({
            ...prev,
            isDialogOpen: false,
            selectedUser: "",
          }))
        }
        users={users}
        selectedUser={uiState.selectedUser}
        setSelectedUser={(user) =>
          setUiState((prev) => ({ ...prev, selectedUser: user }))
        }
        isLoadingUsers={isLoadingUsers}
        isAssigning={isAssigning}
        onAssign={handleAssignLeads}
        onUnassign={handleUnassignLeads}
        selectedLeads={selectedLeads}
        isUnassignDialogOpen={uiState.isUnassignDialogOpen}
        onUnassignDialogChange={(open) =>
          setUiState((prev) => ({ ...prev, isUnassignDialogOpen: open }))
        }
        isUnassigning={isUnassigning}
        assignedLeadsCount={counts.assigned}
      />
    </div>
  );
};

export default LeadsPageContent;
