// src/components/billing/BillingHeader.tsx

"use client";

import React from "react";

interface BillingHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function BillingHeader({}: BillingHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold dark:text-white text-gray-900 mb-2">
            Billing & Fund Account
          </h1>
          <p className="dark:text-gray-300 text-gray-600">
            Fund your account securely
          </p>
        </div>
      </div>
    </div>
  );
}
