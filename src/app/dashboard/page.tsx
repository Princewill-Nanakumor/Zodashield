"use client";

import { useEffect, useState, useCallback } from "react";
import { BarChart3, LogOut, Users, ListChecks } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

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

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const [leadCount, setLeadCount] = useState<number | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [statusCounts, setStatusCounts] = useState<StatusCount[]>([]);

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

  useEffect(() => {
    if (status === "authenticated") {
      fetchLeadCount();
      fetchUsers();
      fetchStatusCounts();
    }
  }, [status, fetchLeadCount, fetchUsers, fetchStatusCounts]);

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
