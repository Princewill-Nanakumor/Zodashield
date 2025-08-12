// components/homepageComponents/PricingSection.tsx
"use client";

import Link from "next/link";
import { Check } from "lucide-react";

export default function PricingSection() {
  const plans = [
    {
      name: "Starter",
      price: "$10.99",
      period: "per month",
      description: "Perfect for small businesses getting started",
      popular: false,
      features: ["Up to 10,000 leads", "2 team member", "CSV/Excel import"],
    },
    {
      name: "Professional",
      price: "$19.99",
      period: "per month",
      description: "Best for growing businesses",
      popular: true,
      features: [
        "Up to 30,000 leads",
        "5 team members",
        "More Team collaboration",
        "Custom fields",
        "Bulk operations",
      ],
    },
    {
      name: "Enterprise",
      price: "$199.99",
      period: "per month",
      description: "For large organizations",
      popular: false,
      features: [
        "Unlimited leads",
        "Unlimited members",
        "All features included",
        "24/7 dedicated support",
        "Advanced security",
        "Custom workflows",
        "Advanced import features",
      ],
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-6">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-indigo-900/70 dark:text-gray-300 max-w-2xl mx-auto">
            Choose the perfect plan for your business. Upgrade or downgrade at
            any time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-8 shadow-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                plan.popular
                  ? "border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20 dark:ring-indigo-400/20"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-indigo-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-indigo-900/70 dark:text-gray-400 mb-4">
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center mb-2">
                  <span className="text-4xl font-bold text-indigo-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-indigo-900/70 dark:text-gray-400 ml-2">
                    {plan.period}
                  </span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-indigo-900/80 dark:text-gray-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className={`block w-full text-center py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                  plan.popular
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl"
                    : "bg-white/50 hover:bg-white/70 dark:bg-gray-700/50 dark:hover:bg-gray-700/70 text-indigo-900 dark:text-white border border-indigo-200 dark:border-gray-600"
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
        <div className="text-center mt-12">
          <p className="text-indigo-900/70 dark:text-gray-400 mb-4">
            All plans include 3-day free trial • No setup fees
          </p>
        </div>
      </div>
    </section>
  );
}
