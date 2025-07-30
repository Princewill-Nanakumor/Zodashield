// src/components/adminManagement/AdminDetailsContent.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdminInfoCard from "./AdminInfoCard";
import AdminStatsCards from "./AdminStatsCards";
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

      <AdminInfoCard
        admin={admin}
        subscription={subscription}
        getStatusColor={getStatusColor}
        formatLastLogin={formatLastLogin}
      />

      <AdminStatsCards
        agentsCount={agents.length}
        leadsCount={leads.length}
        activitiesCount={activities.length}
        adsCount={ads.length}
        balance={admin.balance}
        paymentsCount={payments.length}
        formatBalance={formatBalance}
      />

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
