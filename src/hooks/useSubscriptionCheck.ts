// src/hooks/useSubscriptionCheck.ts
import { useState, useEffect } from "react";

interface SubscriptionData {
  isOnTrial: boolean;
  trialEndsAt: string | null;
  currentPlan: string | null;
  subscriptionStatus: "active" | "inactive" | "trial" | "expired";
  balance: number;
}

export const useSubscriptionCheck = (status: string) => {
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);

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

          const now = new Date();
          const trialEndDate = data.trialEndsAt
            ? new Date(data.trialEndsAt)
            : null;
          const isTrialExpired = trialEndDate && now > trialEndDate;

          const hasActiveSub =
            data.subscriptionStatus === "active" ||
            (data.subscriptionStatus === "trial" && !isTrialExpired);

          setHasActiveSubscription(hasActiveSub);
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

  return { subscriptionLoading, hasActiveSubscription, subscriptionData };
};
