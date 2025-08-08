// src/components/adminManagement/AdminStats.tsx
"use client";

import {
  Users,
  UserCheck,
  Activity,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlatformStats {
  totalAdmins: number;
  totalAgents: number;
  totalLeads: number;
  activeSubscriptions: number;
  totalBalance?: number;
}

interface AdminStatsProps {
  platformStats: PlatformStats | null;
}

export default function AdminStats({ platformStats }: AdminStatsProps) {
  const formatBalance = (balance?: number) => {
    if (!balance) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(balance);
  };

  if (!platformStats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {[...Array(5)].map((_, index) => (
          <Card
            key={index}
            className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                Loading...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                -
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
            Total Admins
          </CardTitle>
          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {platformStats.totalAdmins.toLocaleString()}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            System administrators
          </p>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
            Total Agents
          </CardTitle>
          <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {platformStats.totalAgents.toLocaleString()}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Created team members
          </p>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
            Total Leads
          </CardTitle>
          <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {platformStats.totalLeads.toLocaleString()}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Calculated from all admins
          </p>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
            Active Subscriptions
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {platformStats.activeSubscriptions.toLocaleString()}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Admins with active plans
          </p>
        </CardContent>
      </Card>

      <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
            Total Balance
          </CardTitle>
          <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatBalance(platformStats.totalBalance)}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Combined balance
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
