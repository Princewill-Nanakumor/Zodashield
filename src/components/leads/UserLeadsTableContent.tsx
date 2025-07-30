"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lead } from "@/types/leads";
import { TablePagination } from "@/components/leads/TablePagination";
import LeadDetailsPanel from "@/components/dashboardComponents/LeadDetailsPanel";
import { UserLeadTable } from "@/components/user-leads/UserLeadTable";
import { UserLeadTableControls } from "@/components/user-leads/UserLeadTableControls";
import { UserLeadsHeader } from "@/components/leads/UserLeadsHeader";
import { UserLeadsFilterControls } from "@/components/leads/UserLeadsFilterControls";
import {
  LoadingSpinner,
  TableSkeleton,
} from "@/components/leads/UserLeadsLoadingStates";
import { LeadDataManager } from "@/components/user-leads/LeadDataManager";
import { FilterLogic } from "@/components/user-leads/FilterLogic";
import { URLStateManager } from "../user-leads/URLStatemanager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield } from "lucide-react";

const DEFAULT_PAGE_SIZE = 10;

type SortField = "name" | "country" | "status" | "source" | "createdAt";
type SortOrder = "asc" | "desc";

// Proper TypeScript interface for subscription data
interface SubscriptionData {
  isOnTrial: boolean;
  trialEndsAt: string | null;
  currentPlan: string | null;
  subscriptionStatus: "active" | "inactive" | "trial" | "expired";
  balance: number;
}

export default function UserLeadsContent() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(0);
  const [filterByCountry, setFilterByCountry] = useState<string>("all");

  // Subscription state
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);

  // Get sort parameters from URL or use defaults
  const [sortField, setSortField] = useState<SortField>(() => {
    const urlSortField = searchParams.get("sortField") as SortField;
    return urlSortField || "name";
  });
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    const urlSortOrder = searchParams.get("sortOrder") as SortOrder;
    return urlSortOrder || "asc";
  });

  // Check subscription status on mount
  useEffect(() => {
    const checkSubscription = async () => {
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

          console.log("Subscription check for user leads:", {
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

    if (status === "authenticated") {
      checkSubscription();
    }
  }, [status]);

  // Set data ready state when initial load completes
  useEffect(() => {
    if (!loading) {
      setIsDataReady(true);
    }
  }, [loading]);

  // Reset data ready state when starting a new load
  useEffect(() => {
    if (loading) {
      setIsDataReady(false);
    }
  }, [loading]);

  // Optimized lead selection effect
  useEffect(() => {
    const leadId = searchParams.get("lead");
    if (leadId && isDataReady) {
      const lead = leads.find((l) => l._id === leadId);
      if (lead) {
        setSelectedLead(lead);
        setIsPanelOpen(true);
      } else {
        setIsPanelOpen(false);
        setSelectedLead(null);
      }
    } else {
      setIsPanelOpen(false);
      setSelectedLead(null);
    }
  }, [leads, searchParams, isDataReady]);

  // In UserLeadsContent, add this effect to force re-render when leads change
  useEffect(() => {
    console.log("Leads updated in UserLeadsContent:", leads.length);
  }, [leads]);

  // Also update the handleLeadUpdated to be more robust
  const handleLeadUpdated = useCallback(
    async (updatedLead: Lead) => {
      console.log(" LEAD UPDATED:", {
        leadId: updatedLead._id,
        newStatus: updatedLead.status,
      });

      // Update the leads array with the updated lead
      setLeads((prevLeads) => {
        const updatedLeads = prevLeads.map((lead) =>
          lead._id === updatedLead._id ? updatedLead : lead
        );
        console.log("📊 Updated leads array:", updatedLeads.length, "leads");
        return updatedLeads;
      });

      // Update selected lead if it's the same one
      if (selectedLead?._id === updatedLead._id) {
        console.log("🎯 Updating selected lead");
        setSelectedLead(updatedLead);
      }

      return true;
    },
    [selectedLead?._id]
  );

  const handlePageSizeChange = useCallback((value: string) => {
    setPageSize(parseInt(value));
    setPageIndex(0);
  }, []);

  const handlePageChange = useCallback((newPageIndex: number) => {
    setPageIndex(newPageIndex);
  }, []);

  const handleSort = useCallback(
    (field: SortField) => {
      const newOrder =
        sortField === field && sortOrder === "asc" ? "desc" : "asc";
      const params = new URLSearchParams(searchParams);
      params.set("sortField", field);
      params.set("sortOrder", newOrder);
      router.push(`?${params.toString()}`, { scroll: false });
      setSortField(field);
      setSortOrder(newOrder);
    },
    [sortField, sortOrder, searchParams, router]
  );

  const handleLeadClick = useCallback(
    (lead: Lead) => {
      const params = new URLSearchParams(searchParams);
      params.set("lead", lead._id);
      params.set("name", `${lead.firstName}-${lead.lastName}`);
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  const handlePanelClose = useCallback(() => {
    const params = new URLSearchParams(searchParams);
    params.delete("lead");
    params.delete("name");
    router.push(`?${params.toString()}`, { scroll: false });
    setIsPanelOpen(false);
    setSelectedLead(null);
  }, [searchParams, router]);

  const handleCountryFilterChange = useCallback(
    (country: string) => {
      setFilterByCountry(country);
      setPageIndex(0); // Reset to first page when filtering
      const params = new URLSearchParams(searchParams);
      if (country === "all") {
        params.delete("country");
      } else {
        params.set("country", country);
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router]
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  const currentIndex =
    selectedLead && isDataReady
      ? leads.findIndex((lead) => lead._id === selectedLead._id)
      : -1;

  if (status === "loading") {
    return <LoadingSpinner />;
  }

  // Show skeleton while checking subscription
  if (subscriptionLoading) {
    return (
      <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border-1">
        <div className="w-full h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6" />
        <div className="w-full h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6" />
        <div className="w-full h-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
    );
  }

  // Show subscription required message if no active subscription
  if (!hasActiveSubscription) {
    return (
      <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border-1">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
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
      </div>
    );
  }

  return (
    <LeadDataManager onLeadsLoaded={setLeads} onLoadingChange={setLoading}>
      <URLStateManager>
        <FilterLogic
          leads={leads}
          filterByCountry={filterByCountry}
          sortField={sortField}
          sortOrder={sortOrder}
          isDataReady={isDataReady}
        >
          {({ filteredLeads, sortedLeads, availableCountries }) => {
            // Calculate paginated leads without useMemo
            let paginatedLeads: Lead[] = [];
            if (isDataReady && sortedLeads.length > 0) {
              const startIndex = pageIndex * pageSize;
              const endIndex = startIndex + pageSize;

              // Reset page if current page is out of bounds
              if (startIndex >= sortedLeads.length && pageIndex > 0) {
                const newPageIndex = Math.floor(
                  (sortedLeads.length - 1) / pageSize
                );
                setPageIndex(newPageIndex);
                paginatedLeads = sortedLeads.slice(
                  newPageIndex * pageSize,
                  (newPageIndex + 1) * pageSize
                );
              } else {
                paginatedLeads = sortedLeads.slice(startIndex, endIndex);
              }
            }

            // Calculate counts without useMemo
            const counts = isDataReady
              ? {
                  total: leads.length,
                  filtered: filteredLeads.length,
                  currentPage: paginatedLeads.length,
                  totalPages: Math.ceil(filteredLeads.length / pageSize),
                  countries: availableCountries.length,
                }
              : {
                  total: 0,
                  filtered: 0,
                  currentPage: 0,
                  totalPages: 0,
                  countries: 0,
                };

            // Determine if we should show loading states
            const shouldShowLoading = loading && leads.length === 0;

            return (
              <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border-1">
                {/* Header */}
                <UserLeadsHeader
                  shouldShowLoading={shouldShowLoading}
                  counts={counts}
                />

                {/* Filter Controls */}
                <UserLeadsFilterControls
                  shouldShowLoading={shouldShowLoading}
                  filterByCountry={filterByCountry}
                  onCountryFilterChange={handleCountryFilterChange}
                  availableCountries={availableCountries}
                  counts={counts}
                />

                {/* Main Content */}
                {shouldShowLoading ? (
                  <TableSkeleton />
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <UserLeadTableControls
                      pageSize={pageSize}
                      pageIndex={pageIndex}
                      totalEntries={counts.filtered}
                      onPageSizeChange={handlePageSizeChange}
                    />

                    <UserLeadTable
                      loading={loading}
                      paginatedLeads={paginatedLeads}
                      onLeadClick={handleLeadClick}
                      selectedLead={selectedLead}
                      sortField={sortField}
                      sortOrder={sortOrder}
                      onSort={handleSort}
                    />

                    {counts.filtered > 0 && (
                      <div className="border-t border-gray-200 dark:border-gray-700">
                        <TablePagination
                          pageIndex={pageIndex}
                          pageCount={counts.totalPages}
                          onPageChange={handlePageChange}
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Lead Details Panel */}
                {isPanelOpen && selectedLead && isDataReady && (
                  <LeadDetailsPanel
                    lead={selectedLead}
                    isOpen={isPanelOpen}
                    onClose={handlePanelClose}
                    onLeadUpdated={handleLeadUpdated}
                    onNavigate={(direction) => {
                      if (!selectedLead || !isDataReady) return;

                      const index = sortedLeads.findIndex(
                        (lead) => lead._id === selectedLead._id
                      );
                      const newIndex =
                        direction === "prev" ? index - 1 : index + 1;
                      if (newIndex >= 0 && newIndex < sortedLeads.length) {
                        const newLead = sortedLeads[newIndex];
                        const params = new URLSearchParams(searchParams);
                        params.set("lead", newLead._id);
                        params.set(
                          "name",
                          `${newLead.firstName}-${newLead.lastName}`
                        );
                        router.push(`?${params.toString()}`, { scroll: false });
                      }
                    }}
                    hasPrevious={currentIndex > 0}
                    hasNext={currentIndex < sortedLeads.length - 1}
                  />
                )}
              </div>
            );
          }}
        </FilterLogic>
      </URLStateManager>
    </LeadDataManager>
  );
}
