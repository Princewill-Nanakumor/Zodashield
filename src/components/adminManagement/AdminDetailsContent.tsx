// src/components/adminManagement/AdminDetailsContent.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  UserCheck,
  Activity,
  Mail,
  Phone,
  Globe,
  Shield,
  TrendingUp,
  Clock,
  DollarSign,
  FileImage,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SubscriptionDetails from "@/components/adminManagement/SubscriptionDetails";
import AdsList from "@/components/adminManagement/AdsList";
import ActivitiesList from "@/components/adminManagement/ActivitiesList";
import AgentsList from "@/components/adminManagement/AgentsList";
import PaymentDetails from "@/components/adminManagement/PaymentDetails";

interface AdminDetails {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  country?: string;
  status: string;
  lastLogin?: string;
  createdAt: string;
  balance?: number;
}

interface Agent {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  lastLogin?: string;
  createdAt: string;
}

interface Lead {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  createdAt: string;
}

interface Subscription {
  _id: string;
  plan: string;
  status: string;
  maxUsers: number;
  maxLeads: number;
  endDate: string;
  amount: number;
  currency: string;
}

interface ActivityType {
  _id: string;
  type: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  details: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

interface Ad {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  status: string;
  createdAt: string;
}

interface Payment {
  _id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  transactionId: string;
  createdAt: string;
  description?: string;
  subscriptionId?: string;
}

export default function AdminDetailsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const adminId = params.Id as string;

  // Get active tab from URL or default to "agents"
  const activeTab = searchParams.get("tab") || "agents";

  const [admin, setAdmin] = useState<AdminDetails | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminDetails = useCallback(async () => {
    if (!adminId) {
      setError("No admin ID provided");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/${adminId}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      if (!data.admin) throw new Error("Admin not found");

      setAdmin(data.admin);
      setAgents(data.agents || []);
      setLeads(data.leads?.data || []);
      setSubscription(data.subscription);
      setActivities(data.activities || []);
      setAds(data.ads || []);
      setPayments(data.payments || []);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to fetch admin details"
      );
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role === "ADMIN" && adminId) {
      fetchAdminDetails();
    }
  }, [session, adminId, fetchAdminDetails]);

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    router.push(`?${params.toString()}`, { scroll: false });
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
            Loading admin details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={fetchAdminDetails}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Admin not found
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/admin-management")}
          >
            Back to Admin Management
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 rounded-lg border">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/admin-management")}
            className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 border-gray-200 dark:border-gray-700 hover:bg-white/90 dark:hover:bg-gray-900/90"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {admin.firstName} {admin.lastName}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Administrator Details
            </p>
          </div>
        </div>
      </div>

      {/* Admin Info Card */}
      <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <Shield className="h-5 w-5" />
            <span>Admin Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                  {admin.firstName[0]}
                  {admin.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {admin.firstName} {admin.lastName}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge className={getStatusColor(admin.status)}>
                    {admin.status}
                  </Badge>
                  {subscription && (
                    <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                      {subscription.plan}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {admin.email}
                </span>
              </div>
              {admin.phoneNumber && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {admin.phoneNumber}
                  </span>
                </div>
              )}
              {admin.country && (
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {admin.country}
                  </span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Last login: {formatLastLogin(admin.lastLogin)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
              Total Agents
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {agents.length}
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
              {leads.length}
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
              Recent Activities
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {activities.length}
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
              Total Ads
            </CardTitle>
            <FileImage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {ads.length}
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
              Balance
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatBalance(admin.balance)}
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
              Payments
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {payments.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for detailed information */}
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 border-gray-200 dark:border-gray-700 shadow-xl">
          <TabsTrigger value="agents" className="text-gray-900 dark:text-white">
            Agents ({agents.length})
          </TabsTrigger>
          <TabsTrigger
            value="activities"
            className="text-gray-900 dark:text-white"
          >
            Activities ({activities.length})
          </TabsTrigger>
          <TabsTrigger value="ads" className="text-gray-900 dark:text-white">
            Ads ({ads.length})
          </TabsTrigger>
          <TabsTrigger
            value="subscription"
            className="text-gray-900 dark:text-white"
          >
            Subscription
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="text-gray-900 dark:text-white"
          >
            Payments ({payments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-4">
          <AgentsList
            agents={agents}
            getStatusColor={getStatusColor}
            formatLastLogin={formatLastLogin}
          />
        </TabsContent>

        <TabsContent value="activities" className="space-y-4">
          <ActivitiesList activities={activities} />
        </TabsContent>

        <TabsContent value="ads" className="space-y-4">
          <AdsList ads={ads} />
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4">
          <SubscriptionDetails subscription={subscription} />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <PaymentDetails payments={payments} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
