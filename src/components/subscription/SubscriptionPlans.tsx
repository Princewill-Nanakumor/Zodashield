"use client";

import React from "react";
import { Check, Star, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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

interface UsageData {
  currentLeads: number;
  currentUsers: number;
  maxLeads: number;
  maxUsers: number;
}

interface SubscriptionPlansProps {
  plans: SubscriptionPlan[];
  currentPlan: string | null;
  balance: number;
  subscriptionStatus?: "active" | "inactive" | "trial" | "expired";
  usageData?: UsageData | null;
  onSubscribe: (plan: SubscriptionPlan) => void;
}

export default function SubscriptionPlans({
  plans,
  currentPlan,
  balance,
  subscriptionStatus,
  usageData,
  onSubscribe,
}: SubscriptionPlansProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const canAfford = (plan: SubscriptionPlan) => {
    return balance >= plan.price;
  };

  const hasZeroBalance = balance === 0;

  // Check if selecting this plan would be a downgrade that exceeds limits
  const wouldExceedLimits = (plan: SubscriptionPlan) => {
    if (!usageData) return false;

    const currentPlanData = plans.find((p) => p.id === currentPlan);
    if (!currentPlanData) return false;

    // Check if this is a downgrade (lower limits than current plan)
    const isDowngrade =
      plan.maxLeads < currentPlanData.maxLeads ||
      plan.maxUsers < currentPlanData.maxUsers;

    if (!isDowngrade) return false;

    // Check if current usage would exceed the new plan limits
    const wouldExceedLeads = usageData.currentLeads > plan.maxLeads;
    const wouldExceedUsers = usageData.currentUsers > plan.maxUsers;

    return wouldExceedLeads || wouldExceedUsers;
  };

  return (
    <div className="space-y-6">
      {/* Subscription Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isCurrentPlan = currentPlan === plan.id;
          const isActiveCurrentPlan =
            isCurrentPlan && subscriptionStatus === "active";
          const isExpiredCurrentPlan =
            isCurrentPlan && subscriptionStatus === "expired";
          const hasEnoughBalance = canAfford(plan);
          const wouldExceedLimitsOnDowngrade = wouldExceedLimits(plan);

          return (
            <Card
              key={plan.id}
              className={`relative transition-all duration-200 hover:shadow-xl dark:bg-gray-700  ${
                plan.isPopular
                  ? "border-purple-500 dark:border-purple-400 shadow-lg"
                  : "border-gray-200 dark:border-gray-700"
              } ${
                isActiveCurrentPlan
                  ? "ring-2 ring-green-500 dark:ring-green-400"
                  : ""
              } ${
                isExpiredCurrentPlan
                  ? "ring-2 ring-red-500 dark:ring-red-400"
                  : ""
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white px-3 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              {isActiveCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-green-600 text-white px-3 py-1">
                    Current Plan
                  </Badge>
                </div>
              )}

              {isExpiredCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-red-600 text-white px-3 py-1">
                    Expired Plan
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  {plan.name}
                </CardTitle>
                <div className="flex items-baseline justify-center space-x-1">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(plan.price)}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    /{plan.billingCycle}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center space-y-2">
                    {isActiveCurrentPlan ? (
                      <Button
                        disabled
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        Current Plan
                      </Button>
                    ) : isExpiredCurrentPlan ? (
                      <Button
                        onClick={() => onSubscribe(plan)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white"
                      >
                        Renew Subscription
                      </Button>
                    ) : hasZeroBalance ? (
                      <div className="space-y-2">
                        <Button
                          onClick={() =>
                            (window.location.href = "/dashboard/billing")
                          }
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Add Funds First
                        </Button>
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          Need {formatCurrency(plan.price)} to subscribe
                        </p>
                      </div>
                    ) : !hasEnoughBalance ? (
                      <div className="space-y-2">
                        <Button
                          disabled
                          className="w-full bg-gray-400 text-white cursor-not-allowed"
                        >
                          Insufficient Balance
                        </Button>
                        <p className="text-xs text-red-600 dark:text-red-400">
                          Need {formatCurrency(plan.price - balance)}
                        </p>
                      </div>
                    ) : wouldExceedLimitsOnDowngrade ? (
                      <div className="space-y-2">
                        <Button
                          disabled
                          className="w-full bg-orange-500 text-white cursor-not-allowed"
                        >
                          Downgrade Not Allowed
                        </Button>
                        <p className="text-xs text-orange-600 dark:text-orange-400">
                          Current usage exceeds this plan&apos;s limits
                        </p>
                      </div>
                    ) : (
                      <Button
                        onClick={() => onSubscribe(plan)}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                      >
                        Subscribe Now
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
