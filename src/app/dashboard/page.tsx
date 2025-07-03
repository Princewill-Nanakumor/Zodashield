"use client";

import { useEffect, useState, useCallback } from "react";
import { BarChart3, LogOut, Users, ListChecks, Search } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Lead } from "@/types/leads";

type StatusCount = {
  id: string;
  name: string;
  color: string;
  count: number;
};

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  country: string;
  role: string;
  status: string;
  permissions: string[];
  createdBy: string;
  createdAt: string;
  lastLogin?: string;
}

// Utility function to get assigned user ID
const getAssignedUserId = (assignedTo: unknown): string | null => {
  if (!assignedTo) return null;
  if (typeof assignedTo === "string") return assignedTo;
  if (assignedTo && typeof assignedTo === "object") {
    const assignedToObj = assignedTo as Record<string, unknown>;
    if (assignedToObj.id && typeof assignedToObj.id === "string")
      return assignedToObj.id;
    if (assignedToObj._id && typeof assignedToObj._id === "string")
      return assignedToObj._id;
    return null;
  }
  return null;
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const [leadCount, setLeadCount] = useState<number | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);
  const [leadStats, setLeadStats] = useState({
    total: 0,
    assigned: 0,
    unassigned: 0,
  });

  const fetchLeadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/leads/count");
      if (!res.ok) throw new Error("Failed to fetch lead count");
      const data = await res.json();
      setLeadCount(data.count);
    } catch (error) {
      console.error("Error fetching lead count:", error);
      setLeadCount(null);
      toast({
        title: "Error",
        description: "Failed to load total lead count.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchUsers = useCallback(async () => {
    if (session?.user?.role !== "ADMIN") return;

    try {
      const response = await fetch("/api/users", {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
      setUsers([]);
    }
  }, [toast, session?.user?.role]);

  const fetchStatusCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/leads/status-counts");
      if (!res.ok) throw new Error("Failed to fetch status counts");
      const data = await res.json();
      setStatusCounts(
        (data.statusCounts || []).filter(
          (status: StatusCount & { isDeleted?: boolean }) => !status.isDeleted
        )
      );
    } catch (error) {
      console.error("Error fetching status counts:", error);
      setStatusCounts([]);
      toast({
        title: "Error",
        description: "Failed to load lead status counts.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Fetch lead statistics
  const fetchLeadStats = useCallback(async () => {
    try {
      const res = await fetch("/api/leads/all");
      if (!res.ok) throw new Error("Failed to fetch leads");
      const data = await res.json();
      const leads = Array.isArray(data) ? data : [];

      const total = leads.length;
      const unassigned = leads.filter(
        (lead: Lead) => !getAssignedUserId(lead.assignedTo)
      ).length;
      const assigned = total - unassigned;

      setLeadStats({ total, assigned, unassigned });
    } catch (error) {
      console.error("Error fetching lead stats:", error);
      toast({
        title: "Error",
        description: "Failed to load lead statistics.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchLeadCount();
      fetchUsers();
      fetchStatusCounts();
      fetchLeadStats();
    }
  }, [status, fetchLeadCount, fetchUsers, fetchStatusCounts, fetchLeadStats]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/signin" });
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-700 dark:text-gray-300">Loading dashboard...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const activeUsers = users.filter((user) => user.status === "ACTIVE");
  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard Overview
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Welcome back, {session?.user?.firstName || "User"}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      {/* Lead Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Leads Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Leads
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {leadStats.total.toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        {/* Assigned Leads Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Assigned Leads
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {leadStats.assigned.toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        {/* Unassigned Leads Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Unassigned Leads
              </p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {leadStats.unassigned.toLocaleString()}
              </p>
            </div>
            <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
              <Search className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 ${
          isAdmin ? "md:grid-cols-3" : "md:grid-cols-2"
        } gap-6`}
      >
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
              <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-300" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Leads
              </p>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {leadCount !== null ? leadCount : "..."}
              </h3>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-lg">
                <Users className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total Active Users
                </p>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {activeUsers.length}
                </h3>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
              <ListChecks className="h-6 w-6 text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Leads by Status
              </p>
              <ul className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {statusCounts.length === 0 && <li>...</li>}
                {statusCounts.map((status) => (
                  <li key={status.id} className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ backgroundColor: status.color }}
                      title={status.name}
                    />
                    <span className="font-semibold">{status.name}:</span>{" "}
                    {status.count}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          {/* Add activity content */}
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Performance
          </h2>
          {/* Add performance chart */}
        </div>
      </div>
    </div>
  );
}
