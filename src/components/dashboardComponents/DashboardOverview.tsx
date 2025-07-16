"use client";

import React, { useEffect, useState, useCallback } from "react";
import { BarChart3, Users, Search } from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { Lead } from "@/types/leads";

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

interface DashboardStats {
  total: number;
  assigned: number;
  unassigned: number;
  myLeads: number;
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

// Loading skeleton for stat cards
const StatCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="min-h-[60px] flex flex-col justify-center">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
      </div>
      <div className="h-12 w-12 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
    </div>
  </div>
);

interface DashboardOverviewProps {
  className?: string;
}

export default function DashboardOverview({
  className = "",
}: DashboardOverviewProps) {
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [leadStats, setLeadStats] = useState<DashboardStats>({
    total: 0,
    assigned: 0,
    unassigned: 0,
    myLeads: 0,
  });

  // Loading states
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingLeadStats, setIsLoadingLeadStats] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (session?.user?.role !== "ADMIN") return;

    setIsLoadingUsers(true);
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
    } finally {
      setIsLoadingUsers(false);
    }
  }, [toast, session?.user?.role]);

  const fetchLeadStats = useCallback(async () => {
    setIsLoadingLeadStats(true);
    try {
      const endpoint =
        session?.user?.role === "ADMIN"
          ? "/api/leads/all"
          : "/api/leads/assigned";

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error("Failed to fetch leads");
      const data = await res.json();
      const leads = Array.isArray(data)
        ? data
        : data.assignedLeads // /api/leads/assigned returns { assignedLeads: [...] }
          ? data.assignedLeads
          : [];

      if (session?.user?.role === "ADMIN") {
        // Admin sees all stats
        const total = leads.length;
        const unassigned = leads.filter(
          (lead: Lead) => !getAssignedUserId(lead.assignedTo)
        ).length;
        const assigned = total - unassigned;

        setLeadStats({ total, assigned, unassigned, myLeads: 0 });
      } else {
        // Agent: Only count leads assigned to this user
        setLeadStats({
          total: 0,
          assigned: 0,
          unassigned: 0,
          myLeads: leads.length,
        });
      }
    } catch (error) {
      console.error("Error fetching lead stats:", error);
      toast({
        title: "Error",
        description: "Failed to load lead statistics.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingLeadStats(false);
    }
  }, [toast, session?.user?.role]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchUsers();
      fetchLeadStats();
    }
  }, [status, fetchUsers, fetchLeadStats]);

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
    <div
      className={`container mx-auto p-8 space-y-8 bg-background dark:bg-gray-800 rounded-md border ${className}`}
    >
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard Overview
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Welcome back, {session?.user?.firstName || "User"}
          </p>
        </div>
      </div>

      {/* Statistics Cards Grid */}
      {isAdmin ? (
        // Admin Dashboard - All 4 cards in grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Leads Card */}
          {isLoadingLeadStats ? (
            <StatCardSkeleton />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div className="min-h-[60px] flex flex-col justify-center">
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
          )}

          {/* Total Active Users Card */}
          {isLoadingUsers ? (
            <StatCardSkeleton />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div className="min-h-[60px] flex flex-col justify-center">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active Users
                  </p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {activeUsers.length.toLocaleString()}
                  </p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>
          )}

          {/* Assigned Leads Card */}
          {isLoadingLeadStats ? (
            <StatCardSkeleton />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div className="min-h-[60px] flex flex-col justify-center">
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
          )}

          {/* Unassigned Leads Card */}
          {isLoadingLeadStats ? (
            <StatCardSkeleton />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div className="min-h-[60px] flex flex-col justify-center">
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
          )}
        </div>
      ) : (
        // User/Agent Dashboard - Only My Leads card (no grid, single card)
        <div className="max-w-sm">
          {isLoadingLeadStats ? (
            <StatCardSkeleton />
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div className="min-h-[60px] flex flex-col justify-center">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    My Assigned Leads
                  </p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {leadStats.myLeads.toLocaleString()}
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
