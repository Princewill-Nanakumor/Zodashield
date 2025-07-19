// src/components/adminManagement/AdminManagementContent.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserCheck,
  Activity,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Clock,
  DollarSign,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Define proper types for activity data
interface ActivityData {
  _id: string;
  type: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  details: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

interface AdminStats {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  lastLogin?: string;
  createdAt: string;
  agentCount: number;
  leadCount: number;
  balance?: number;
  subscription?: {
    plan: string;
    status: string;
    maxUsers: number;
    maxLeads: number;
    endDate: string;
  };
  recentActivity: ActivityData[];
  lastAgentLogin?: {
    lastLogin?: string;
    firstName: string;
    lastName: string;
  };
}

interface PlatformStats {
  totalAdmins: number;
  totalAgents: number;
  totalLeads: number;
  activeSubscriptions: number;
  totalBalance?: number;
}

export default function AdminManagementContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminStats[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [allowedEmails, setAllowedEmails] = useState<string[]>([]);

  useEffect(() => {
    // Get allowed emails from environment variable
    const envEmails = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS;
    if (envEmails) {
      setAllowedEmails(envEmails.split(",").map((email) => email.trim()));
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated") {
      // Check if user is ADMIN and has access
      if (session?.user?.role !== "ADMIN") {
        router.push("/dashboard");
      } else if (
        allowedEmails.length > 0 &&
        !allowedEmails.includes(session.user.email)
      ) {
        // Redirect to dashboard if not authorized
        router.push("/dashboard");
      } else {
        fetchAdminData();
      }
    }
  }, [status, session, router, allowedEmails]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/overview");
      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins);
        setPlatformStats(data.platformStats);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-800";
      case "INACTIVE":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-200 dark:border-red-800";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300 border-gray-200 dark:border-gray-800";
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case "ENTERPRISE":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case "PRO":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "BASIC":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-800";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300 border-gray-200 dark:border-gray-800";
    }
  };

  const formatLastLogin = (lastLogin?: string) => {
    if (!lastLogin) return "Never";

    const date = new Date(lastLogin);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return "Yesterday";

    return date.toLocaleDateString();
  };

  const getLastLoginColor = (lastLogin?: string) => {
    if (!lastLogin) return "text-gray-500 dark:text-gray-400";

    const date = new Date(lastLogin);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 24) return "text-green-600 dark:text-green-400";
    if (diffInHours < 168) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const formatBalance = (balance?: number) => {
    if (!balance) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(balance);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">
            Loading admin data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 border rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage all administrators and monitor their activities
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-800">
            <Shield className="h-3 w-3 mr-1" />
            Super Admin
          </Badge>
        </div>
      </div>

      {/* Platform Stats */}
      {platformStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                Total Admins
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {platformStats.totalAdmins}
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                Total Agents
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {platformStats.totalAgents}
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                Total Leads
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {platformStats.totalLeads}
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                Active Subscriptions
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {platformStats.activeSubscriptions}
              </div>
            </CardContent>
          </Card>

          <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                Total Balance
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatBalance(platformStats.totalBalance)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Admins List */}
      <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">
            All Administrators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {admins.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No administrators found
                </p>
              </div>
            ) : (
              admins.map((admin) => (
                <div
                  key={admin._id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg backdrop-blur-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                        {admin.firstName[0]}
                        {admin.lastName[0]}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {admin.firstName} {admin.lastName}
                        </h3>
                        <Badge className={getStatusColor(admin.status)}>
                          {admin.status}
                        </Badge>
                        {admin.subscription && (
                          <Badge
                            className={getPlanColor(admin.subscription.plan)}
                          >
                            {admin.subscription.plan}
                          </Badge>
                        )}
                        {allowedEmails.includes(admin.email) && (
                          <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                            <Shield className="h-3 w-3 mr-1" />
                            Super Admin
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {admin.email}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mb-2">
                        <span>{admin.agentCount} agents</span>
                        <span>{admin.leadCount} leads</span>
                        {admin.balance && (
                          <span className="text-green-600 dark:text-green-400">
                            {formatBalance(admin.balance)}
                          </span>
                        )}
                      </div>

                      {/* Login Information */}
                      <div className="flex items-center space-x-6 text-xs">
                        {/* Admin Last Login */}
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-500 dark:text-gray-400">
                            Admin:
                          </span>
                          <span className={getLastLoginColor(admin.lastLogin)}>
                            {formatLastLogin(admin.lastLogin)}
                          </span>
                        </div>

                        {/* Agent Last Login */}
                        {admin.lastAgentLogin && (
                          <div className="flex items-center space-x-1">
                            <UserCheck className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-500 dark:text-gray-400">
                              Agent:
                            </span>
                            <span
                              className={getLastLoginColor(
                                admin.lastAgentLogin.lastLogin
                              )}
                            >
                              {formatLastLogin(admin.lastAgentLogin.lastLogin)}
                              <span className="text-gray-400 dark:text-gray-500 ml-1">
                                ({admin.lastAgentLogin.firstName}{" "}
                                {admin.lastAgentLogin.lastName})
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/dashboard/admin-management/${admin._id}`)
                      }
                      className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 border-gray-200 dark:border-gray-700 hover:bg-white/90 dark:hover:bg-gray-900/90"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 border-gray-200 dark:border-gray-700 hover:bg-white/90 dark:hover:bg-gray-900/90"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 border-gray-200 dark:border-gray-700 hover:bg-white/90 dark:hover:bg-gray-900/90"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
