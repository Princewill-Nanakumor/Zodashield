"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import SubscriptionPlans from "./SubscriptionPlans";
import TrialStatus from "./TrialStatus";
import SubscriptionModal from "./SubscriptionModal";
import { useToast } from "@/components/ui/use-toast";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: "monthly" | "yearly";
  features: string[];
  maxLeads: number;
  maxUsers: number;
  isPopular?: boolean;
}

interface SubscriptionData {
  isOnTrial: boolean;
  trialEndsAt: string | null;
  currentPlan: string | null;
  subscriptionStatus: "active" | "inactive" | "trial" | "expired";
  balance: number;
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 10.99,
    billingCycle: "monthly",
    features: ["Up to 10,000 leads", "2 team members", "Activity logging"],
    maxLeads: 10000,
    maxUsers: 2,
  },
  {
    id: "professional",
    name: "Professional",
    price: 19.99,
    billingCycle: "monthly",
    features: [
      "Up to 30,000 leads",
      "5 team members",
      "Activity logging",
      "more leads imports",
    ],
    maxLeads: 30000,
    maxUsers: 5,
    isPopular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 199,
    billingCycle: "monthly",
    features: [
      "Unlimited leads",
      "Unlimited team members",
      "Activity logging",
      "more leads imports",
    ],
    maxLeads: -1,
    maxUsers: -1,
  },
];

export default function SubscriptionManager() {
  const { status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    isOnTrial: true,
    trialEndsAt: null,
    currentPlan: null,
    subscriptionStatus: "trial",
    balance: 0,
  });

  const [loading, setLoading] = useState(true);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(
    null
  );

  // Fetch subscription data
  const fetchSubscriptionData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/subscription/status");

      if (!response.ok) {
        throw new Error("Failed to fetch subscription data");
      }

      const data = await response.json();
      setSubscriptionData(data);
    } catch (error) {
      console.error("Error fetching subscription data:", error);
      toast({
        title: "Error",
        description: "Failed to load subscription information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchSubscriptionData();
    }
  }, [status, fetchSubscriptionData]);

  // Check if user should be redirected
  useEffect(() => {
    if (status === "authenticated" && !loading) {
      const { subscriptionStatus } = subscriptionData;

      // If trial expired and no active subscription, redirect to subscription page
      if (subscriptionStatus === "expired") {
        router.push("/subscription");
        return;
      }

      // If user is on trial but trial has ended, show subscription required
      if (subscriptionStatus === "trial" && subscriptionData.trialEndsAt) {
        const trialEndDate = new Date(subscriptionData.trialEndsAt);
        const now = new Date();

        if (now > trialEndDate) {
          // Trial has expired, redirect to subscription
          router.push("/subscription");
          return;
        }
      }
    }
  }, [status, loading, subscriptionData, router]);

  const handleSubscribe = useCallback((plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowSubscriptionModal(true);
  }, []);

  const handleSubscriptionSuccess = useCallback(async () => {
    setShowSubscriptionModal(false);
    setSelectedPlan(null);

    // Refresh subscription data
    await fetchSubscriptionData();

    toast({
      title: "Success",
      description: "Subscription activated successfully!",
      variant: "success",
    });
  }, [fetchSubscriptionData, toast]);

  const handleCloseModal = useCallback(() => {
    setShowSubscriptionModal(false);
    setSelectedPlan(null);
  }, []);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/signin");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 rounded-xl border">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Subscription Plans
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Choose the perfect plan for your CRM needs
          </p>
        </div>

        {/* Trial Status */}
        <TrialStatus
          subscriptionData={subscriptionData}
          onSubscribe={handleSubscribe}
        />

        {/* Subscription Plans */}
        <SubscriptionPlans
          plans={SUBSCRIPTION_PLANS}
          currentPlan={subscriptionData.currentPlan}
          balance={subscriptionData.balance}
          onSubscribe={handleSubscribe}
        />

        {/* Subscription Modal */}
        {selectedPlan && (
          <SubscriptionModal
            plan={selectedPlan}
            isOpen={showSubscriptionModal}
            onClose={handleCloseModal}
            onSuccess={handleSubscriptionSuccess}
            balance={subscriptionData.balance}
          />
        )}
      </div>
    </div>
  );
}
