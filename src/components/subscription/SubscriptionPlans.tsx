"use client";

import React from "react";
import { Check, Star } from "lucide-react";
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

interface SubscriptionPlansProps {
  plans: SubscriptionPlan[];
  currentPlan: string | null;
  balance: number;
  onSubscribe: (plan: SubscriptionPlan) => void;
}

export default function SubscriptionPlans({
  plans,
  currentPlan,
  balance,
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {plans.map((plan) => {
        const isCurrentPlan = currentPlan === plan.id;
        const hasEnoughBalance = canAfford(plan);

        return (
          <Card
            key={plan.id}
            className={`relative transition-all duration-200 hover:shadow-xl dark:bg-gray-700  ${
              plan.isPopular
                ? "border-purple-500 dark:border-purple-400 shadow-lg"
                : "border-gray-200 dark:border-gray-700"
            } ${
              isCurrentPlan ? "ring-2 ring-green-500 dark:ring-green-400" : ""
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

            {isCurrentPlan && (
              <div className="absolute -top-3 right-4">
                <Badge className="bg-green-600 text-white px-3 py-1">
                  Current Plan
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
                  {isCurrentPlan ? (
                    <Button
                      disabled
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      Current Plan
                    </Button>
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
  );
}
