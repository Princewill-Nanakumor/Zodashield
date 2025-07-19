"use client";

import React from "react";
import { Settings } from "lucide-react";
import RecentTransactions from "./RecentTransactions";
import Support from "./Support";

interface BillingSidebarProps {
  balance?: number;
  totalDeposits?: number;
  pendingAmount?: number;
  recentTransactions?: Array<{
    id: string;
    amount: number;
    status: string;
    date: string;
    type: string;
  }>;
  onTransactionClick?: (transactionId: string) => void;
}

export default function BillingSidebar({
  balance = 0,
  totalDeposits = 0,
  pendingAmount = 0,
  recentTransactions = [],
  onTransactionClick,
}: BillingSidebarProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Account Balance */}
      <div className="dark:backdrop-blur-lg dark:bg-white/5 rounded-2xl p-6 shadow-lg dark:border dark:border-white/10 bg-white border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold dark:text-white text-gray-900">
            Account Balance
          </h3>
          <Settings className="h-5 w-5 dark:text-gray-400 text-gray-500" />
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="dark:text-gray-300 text-gray-600">
              USDT Balance
            </span>
            <span className="font-semibold dark:text-white text-gray-900">
              {formatCurrency(balance)} USDT
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="dark:text-gray-300 text-gray-600">
              Total Deposits
            </span>
            <span className="font-semibold dark:text-white text-gray-900">
              {formatCurrency(totalDeposits)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="dark:text-gray-300 text-gray-600">Pending</span>
            <span className="font-semibold text-yellow-600 dark:text-yellow-400">
              {formatCurrency(pendingAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Transactions Component */}
      <RecentTransactions
        transactions={recentTransactions}
        onTransactionClick={onTransactionClick}
      />

      {/* Support Component */}
      <Support />
    </div>
  );
}
