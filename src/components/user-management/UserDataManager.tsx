// src/components/user-management/UserDataManager.tsx
"use client";

import { useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";

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

interface UsageData {
  currentUsers: number;
  maxUsers: number;
  remainingUsers: number;
  canAddTeamMember: boolean;
}

interface UserDataManagerProps {
  onUsersLoaded: (users: User[]) => void;
  onLoadingChange: (loading: boolean) => void;
  onUsageDataLoaded?: (usageData: UsageData | null) => void;
  children: React.ReactNode;
}

export function UserDataManager({
  onUsersLoaded,
  onLoadingChange,
  onUsageDataLoaded,
  children,
}: UserDataManagerProps) {
  const { data: session } = useSession();
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      onLoadingChange(true);
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
      const users = Array.isArray(data) ? data : [];
      onUsersLoaded(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users.",
        variant: "destructive",
      });
      onUsersLoaded([]);
    } finally {
      onLoadingChange(false);
    }
  }, [toast, onUsersLoaded, onLoadingChange]);

  const fetchUsageData = useCallback(async () => {
    try {
      const response = await fetch("/api/usage", {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      onUsageDataLoaded?.(data);
    } catch (error) {
      console.error("Error fetching usage data:", error);
      onUsageDataLoaded?.(null);
    }
  }, [onUsageDataLoaded]);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchUsers();
      fetchUsageData();
    }
  }, [fetchUsers, fetchUsageData, session]);

  return <>{children}</>;
}
