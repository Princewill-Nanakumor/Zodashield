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

interface UserDataManagerProps {
  onUsersLoaded: (users: User[]) => void;
  onLoadingChange: (loading: boolean) => void;
  refreshTrigger?: number;
  children: React.ReactNode;
}

export function UserDataManager({
  onUsersLoaded,
  onLoadingChange,
  refreshTrigger = 0,
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
        description: (
          <>
            Failed to fetch users.
            <button
              onClick={fetchUsers}
              className="ml-2 underline text-blue-600"
            >
              Retry
            </button>
          </>
        ),
        variant: "destructive",
      });
      onUsersLoaded([]);
    } finally {
      onLoadingChange(false);
    }
  }, [toast, onUsersLoaded, onLoadingChange]);

  // Fetch users on mount and when session changes
  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchUsers();
    }
  }, [fetchUsers, session]);

  // Refetch users when refreshTrigger changes (for manual refresh)
  useEffect(() => {
    if (session?.user?.role === "ADMIN" && refreshTrigger > 0) {
      fetchUsers();
    }
  }, [refreshTrigger, fetchUsers, session]);

  // Refetch users when window regains focus (to recover from timeouts)
  useEffect(() => {
    const handleFocus = () => {
      if (session?.user?.role === "ADMIN") {
        fetchUsers();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchUsers, session]);

  return <>{children}</>;
}
