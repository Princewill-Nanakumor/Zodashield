// src/components/adminManagement/AdminManagementContent.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import AdminStats from "./AdminStats";
import AdminList from "./AdminList";

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
    const envEmails = process.env.SUPER_ADMIN_EMAILS;
    if (envEmails) {
      setAllowedEmails(envEmails.split(",").map((email) => email.trim()));
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated") {
      if (session?.user?.role !== "ADMIN") {
        router.push("/dashboard");
      } else if (
        allowedEmails.length > 0 &&
        !allowedEmails.includes(session.user.email)
      ) {
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

      <AdminStats platformStats={platformStats} />
      <AdminList admins={admins} allowedEmails={allowedEmails} />
    </div>
  );
}
