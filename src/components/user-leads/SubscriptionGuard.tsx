// src/components/user-leads/SubscriptionGuard.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Shield } from "lucide-react";

interface SubscriptionData {
  isOnTrial: boolean;
  trialEndsAt: string | null;
  currentPlan: string | null;
  subscriptionStatus: "active" | "inactive" | "trial" | "expired";
  balance: number;
}

interface SubscriptionGuardProps {
  subscriptionLoading: boolean;
  hasActiveSubscription: boolean;
  subscriptionData: SubscriptionData | null;
  children: React.ReactNode;
}

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({
  subscriptionLoading,
  hasActiveSubscription,
  subscriptionData,
  children,
}) => {
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
                  Admin need an active subscription for Users to view and manage
                  leads.
                  {subscriptionData?.subscriptionStatus === "expired" ||
                  (subscriptionData?.trialEndsAt &&
                    new Date() > new Date(subscriptionData.trialEndsAt))
                    ? " Admin trial has expired."
                    : " Admin need to Subscribe"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
