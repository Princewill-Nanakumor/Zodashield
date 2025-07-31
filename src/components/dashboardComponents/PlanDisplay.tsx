// src/components/dashboardComponents/PlanDisplay.tsx
"use client";
import React, { useEffect, useState } from "react";
import { Crown, Clock } from "lucide-react";

interface SubscriptionData {
  isOnTrial: boolean;
  trialEndsAt: string | null;
  currentPlan: string | null;
  subscriptionStatus: "active" | "inactive" | "trial" | "expired";
  balance: number;
  subscriptionEndDate?: string | null;
}

interface PlanDisplayProps {
  isAdmin: boolean;
}

export function PlanDisplay({ isAdmin }: PlanDisplayProps) {
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  // Fetch subscription data when component mounts
  useEffect(() => {
    if (isAdmin && !subscriptionData) {
      const fetchSubscriptionData = async () => {
        try {
          setSubscriptionLoading(true);
          const response = await fetch("/api/subscription/status");
          if (response.ok) {
            const data = await response.json();
            setSubscriptionData(data);
          }
        } catch (error) {
          console.error("Error fetching subscription data:", error);
        } finally {
          setSubscriptionLoading(false);
        }
      };

      fetchSubscriptionData();
    }
  }, [isAdmin, subscriptionData]);

  // Helper function to calculate remaining days
  const getRemainingDays = () => {
    if (!subscriptionData) return null;

    let endDate: Date | null = null;

    if (
      subscriptionData.subscriptionStatus === "trial" &&
      subscriptionData.trialEndsAt
    ) {
      endDate = new Date(subscriptionData.trialEndsAt);
    } else if (
      subscriptionData.subscriptionStatus === "active" &&
      subscriptionData.subscriptionEndDate
    ) {
      endDate = new Date(subscriptionData.subscriptionEndDate);
    }

    if (!endDate) return null;

    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  };

  // Helper function to format plan name
  const formatPlanName = (
    plan: string | null | undefined,
    status: string | undefined
  ) => {
    // If no subscription data is available, assume trial for admin users
    if (isAdmin && !status && !plan) {
      return "Free Trial";
    }

    if (status === "trial") {
      return "Free Trial";
    }
    if (!plan) return "No Plan";
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  // Helper function to get plan status color
  const getPlanStatusColor = (status: string | undefined) => {
    // If no status but user is admin, assume trial
    if (isAdmin && !status) {
      return "text-blue-600 dark:text-blue-400";
    }

    switch (status) {
      case "active":
        return "text-green-600 dark:text-green-400";
      case "trial":
        return "text-blue-600 dark:text-blue-400";
      case "expired":
        return "text-red-600 dark:text-red-400";
      case "inactive":
        return "text-gray-600 dark:text-gray-400";
      default:
        return "text-gray-600 dark:text-gray-400";
    }
  };

  // Helper function to get plan status text
  const getPlanStatusText = (status: string | undefined) => {
    // If no status but user is admin, assume trial
    if (isAdmin && !status) {
      return "3 Days Free";
    }

    switch (status) {
      case "active":
        return "Active";
      case "trial":
        return "3 Days Free";
      case "expired":
        return "Expired";
      case "inactive":
        return "Inactive";
      default:
        return "No Plan";
    }
  };

  // Helper function to format remaining days text
  const getRemainingDaysText = (
    days: number | null,
    status: string | undefined
  ) => {
    if (days === null) return "";

    if (status === "trial") {
      if (days === 0) return "Time left: 0 days";
      if (days === 1) return "Time left: 1 day";
      return `Time left: ${days} days`;
    } else if (status === "active") {
      if (days === 0) return "Time left: 0 days";
      if (days === 1) return "Time left: 1 day";
      return `Time left: ${days} days`;
    }

    return "";
  };

  const remainingDays = getRemainingDays();

  if (!isAdmin) return null;

  return (
    <div className="flex items-center space-x-2">
      <Crown className="h-3 w-3 text-purple-500 dark:text-purple-400" />
      <div className="flex flex-col">
        <span className="text-xs font-medium text-gray-900 dark:text-white">
          {subscriptionLoading ? (
            <div className="h-3 w-16 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
          ) : (
            formatPlanName(
              subscriptionData?.currentPlan,
              subscriptionData?.subscriptionStatus
            )
          )}
        </span>
        <div className="flex items-center space-x-1">
          {subscriptionLoading ? (
            <div className="h-3 w-12 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
          ) : (
            <>
              <span
                className={`text-xs ${getPlanStatusColor(subscriptionData?.subscriptionStatus)}`}
              >
                {getPlanStatusText(subscriptionData?.subscriptionStatus)}
              </span>
              {remainingDays !== null && (
                <>
                  <span className="text-xs text-gray-400">•</span>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-2.5 w-2.5 text-gray-400" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {getRemainingDaysText(
                        remainingDays,
                        subscriptionData?.subscriptionStatus
                      )}
                    </span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
