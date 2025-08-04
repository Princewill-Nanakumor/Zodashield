// src/app/dashboard/notifications/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { LoadingSpinner } from "@/components/dashboardComponents/LeadsLoadingState";
import NotificationsList from "@/components/notifications/NotificationsList";

interface Notification {
  id: string;
  type: string;
  message: string;
  role: string;
  link?: string;
  paymentId?: string;
  amount?: number;
  currency?: string;
  userId?: string;
  createdAt: string;
  read: boolean;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/notifications", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch notifications");
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to fetch notifications"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDeleteNotification = useCallback(
    async (notificationId: string) => {
      try {
        await fetch(`/api/notifications/${notificationId}`, {
          method: "DELETE",
          credentials: "include",
        });
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      } catch (error) {
        console.error("Error deleting notification:", error);
      }
    },
    []
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
    }
  }, [session, fetchNotifications]);

  if (status === "loading") {
    return <LoadingSpinner />;
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-scree dark:bg-gray-800 rounded-xl border">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Notifications
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View all your payment and subscription notifications
          </p>
        </div>

        {/* Notifications List Component */}
        <NotificationsList
          notifications={notifications}
          loading={loading}
          error={error}
          onDeleteNotification={handleDeleteNotification}
          onRetry={fetchNotifications}
        />
      </div>
    </div>
  );
}
