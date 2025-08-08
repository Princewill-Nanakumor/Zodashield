// src/components/adminManagement/AdminStatsCards.tsx
"use client";

import {
  Users,
  UserCheck,
  Activity,
  FileImage,
  DollarSign,
  CreditCard,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminStatsCardsProps {
  agentsCount: number;
  leadsCount: number; // Now should be the real count
  activitiesCount: number;
  adsCount: number;
  balance?: number;
  paymentsCount: number;
  formatBalance: (balance?: number) => string;
}

export default function AdminStatsCards({
  agentsCount,
  leadsCount,
  activitiesCount,
  adsCount,
  balance,
  paymentsCount,
  formatBalance,
}: AdminStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
      <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
            Agents
          </CardTitle>
          <UserCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {agentsCount?.toLocaleString() || 0}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Team members
          </p>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
            Total Leads
          </CardTitle>
          <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {leadsCount?.toLocaleString() || 0}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Total prospects
          </p>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
            Activities
          </CardTitle>
          <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {activitiesCount?.toLocaleString() || 0}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Recent actions
          </p>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
            Ads
          </CardTitle>
          <FileImage className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {adsCount?.toLocaleString() || 0}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Marketing campaigns
          </p>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
            Balance
          </CardTitle>
          <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatBalance(balance)}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Current balance
          </p>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
            Payments
          </CardTitle>
          <CreditCard className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {paymentsCount?.toLocaleString() || 0}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Transaction history
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
