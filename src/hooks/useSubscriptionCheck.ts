// src/hooks/useSubscriptionCheck.ts
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface SubscriptionData {
  isOnTrial: boolean;
  trialEndsAt: string | null;
  currentPlan: string | null;
  subscriptionStatus: "active" | "inactive" | "trial" | "expired";
  balance: number;
  // Additional fields for agents
  adminName?: string;
  adminEmail?: string;
}

export const useSubscriptionCheck = (status: string) => {
  const { data: session } = useSession();
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);

  useEffect(() => {
    const checkSubscription = async () => {
      if (status !== "authenticated" || !session?.user) {
        setSubscriptionLoading(false);
        setHasActiveSubscription(false);
        return;
      }

      try {
        setSubscriptionLoading(true);

        // For agents, check their admin's subscription status
        // For admins, check their own subscription status
        const endpoint =
          session.user.role === "AGENT"
            ? "/api/subscription/agent-status"
            : "/api/subscription/status";

        const response = await fetch(endpoint, {
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

    checkSubscription();
  }, [status, session?.user]);

  return { subscriptionLoading, hasActiveSubscription, subscriptionData };
};
