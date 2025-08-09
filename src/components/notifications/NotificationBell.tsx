// src/components/notifications/NotificationBell.tsx
"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Bell,
  X,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Notification } from "@/types/notifications";
import { Button } from "@/components/ui/button";

// Raw notification type from API (may have inconsistent id/_id)
interface RawNotification {
  id?: string;
  _id?: string;
  type: string;
  message: string;
  paymentId?: string;
  createdAt: string;
  read: boolean;
  amount?: number;
  currency?: string;
  link?: string;
  [key: string]: unknown;
}

// Loading skeleton component for notification dropdown
const NotificationSkeleton = () => (
  <li className="flex items-start justify-between px-4 py-3 animate-pulse">
    <div className="flex items-start space-x-3 flex-1">
      <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
      <div className="flex-1 min-w-0">
        <div className="space-y-1">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-20 mt-1"></div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-16 mt-1"></div>
      </div>
    </div>
    <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded ml-2 flex-shrink-0"></div>
  </li>
);

export function NotificationBell() {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Normalize notifications to ensure stable keys and API compatibility
  const normalizeNotifications = useCallback(
    (items: RawNotification[]): Notification[] => {
      console.log("🔍 Raw notifications received:", items); // DEBUG

      if (!Array.isArray(items)) {
        console.warn("⚠️ Notifications data is not an array:", items);
        return [];
      }

      const normalized = items
        .map((n, idx) => {
          if (!n || typeof n !== "object") {
            console.warn("⚠️ Invalid notification item:", n);
            return null;
          }

          const safeId =
            n.id ||
            n._id ||
            `${n.type || "unknown"}-${n.paymentId || "na"}-${n.createdAt || idx}`;

          return { ...n, id: String(safeId) } as Notification;
        })
        .filter(Boolean) as Notification[];

      console.log("✅ Normalized notifications:", normalized); // DEBUG
      return normalized;
    },
    []
  );

  // CHANGED: Fetch ALL notifications, not just unread ones
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
    isFetching,
    isRefetching,
  } = useQuery<RawNotification[], Error, Notification[]>({
    queryKey: ["notifications"],
    queryFn: async (): Promise<RawNotification[]> => {
      console.log("🚀 Fetching ALL notifications from API..."); // DEBUG

      // CHANGED: Use /api/notifications/all to get both read and unread
      const response = await fetch("/api/notifications/all", {
        credentials: "include",
      });

      if (!response.ok) {
        console.error("❌ API Error:", response.status, response.statusText);
        throw new Error(
          `HTTP ${response.status}: Failed to fetch notifications`
        );
      }

      const data = await response.json();
      console.log("📦 API Response (ALL notifications):", data); // DEBUG
      return data;
    },
    select: (data) => normalizeNotifications(data),
    enabled: !!session?.user,
    staleTime: 30000,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    retry: 2,
  });

  // Debug logging for render states
  console.log("🎯 NotificationBell render state:", {
    isLoading,
    isFetching,
    isRefetching,
    notificationsCount: notifications.length,
    unreadCount: notifications.filter((n) => !n.read).length,
    hasSession: !!session?.user,
    error: error?.message,
    open,
  });

  // Simplified dropdown toggle
  const handleDropdownToggle = useCallback(() => {
    console.log("🖱️ Bell clicked, toggling from:", open);
    setOpen((prev) => !prev);

    // Always refetch when opening to ensure fresh data
    if (!open) {
      console.log("♻️ Refreshing notifications on open");
      refetch();
    }
  }, [open, refetch]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleNotificationClick = async (notification: Notification) => {
    console.log("🔔 Notification clicked:", notification); // DEBUG

    try {
      // Mark notification as read if not already read
      if (!notification.read) {
        const response = await fetch(`/api/notifications/${notification.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ read: true }),
        });

        if (!response.ok) {
          throw new Error(
            `Failed to mark notification as read: ${response.status}`
          );
        }

        // CHANGED: Update the notification to read: true instead of removing it
        queryClient.setQueryData(
          ["notifications"],
          (oldData: Notification[] = []) => {
            const updated = oldData.map((n) =>
              n.id === notification.id ? { ...n, read: true } : n
            );
            console.log("🔄 Cache updated, marked as read:", notification.id);
            return updated;
          }
        );
      }

      // Enhanced navigation logic
      if (notification.link) {
        console.log("🔗 Navigating to link:", notification.link);

        const paymentIdMatch = notification.link.match(
          /\/payment-details\/([^\/\?]+)/
        );

        if (paymentIdMatch) {
          const paymentId = paymentIdMatch[1];
          console.log("💰 Extracted payment ID:", paymentId);
          router.push(`/dashboard/payment-details/${paymentId}`);
        } else {
          console.log("📍 Direct navigation to:", notification.link);
          router.push(notification.link);
        }
      } else {
        console.log("⚠️ No link found in notification");
      }

      setOpen(false);
    } catch (error) {
      console.error("❌ Error handling notification click:", error);
      refetch();
    }
  };

  const handleClearNotification = useCallback(
    async (notificationId: string, event: React.MouseEvent) => {
      event.stopPropagation();
      console.log("❌ Clearing notification:", notificationId); // DEBUG

      try {
        const response = await fetch(`/api/notifications/${notificationId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ read: true }),
        });

        if (!response.ok) {
          throw new Error(`Failed to clear notification: ${response.status}`);
        }

        // CHANGED: Update the notification to read: true instead of removing it
        queryClient.setQueryData(
          ["notifications"],
          (oldData: Notification[] = []) => {
            const updated = oldData.map((n) =>
              n.id === notificationId ? { ...n, read: true } : n
            );
            console.log(
              "🔄 Cache updated, cleared notification:",
              notificationId
            );
            return updated;
          }
        );
      } catch (error) {
        console.error("❌ Error clearing notification:", error);
        refetch();
      }
    },
    [queryClient, refetch]
  );

  const getNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case "PAYMENT_APPROVED":
        return (
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
        );
      case "PAYMENT_REJECTED":
        return (
          <XCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
        );
      case "PAYMENT_PENDING_APPROVAL":
        return (
          <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
        );
      default:
        return (
          <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
        );
    }
  }, []);

  // CHANGED: Count only unread notifications for the badge
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Simplified loading logic
  const shouldShowLoading =
    isLoading || (isFetching && notifications.length === 0);

  console.log("🎭 Render decision:", {
    shouldShowLoading,
    notificationsLength: notifications.length,
    unreadCount,
  }); // DEBUG

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative p-2 rounded-full hover:bg-purple-400 dark:hover:bg-gray-800 transition"
        aria-label="Notifications"
        type="button"
        onClick={handleDropdownToggle}
      >
        <Bell className="h-6 w-6 text-white dark:text-purple-300" />
        {/* CHANGED: Only show badge if there are unread notifications */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-100 dark:border-gray-800 font-semibold text-gray-800 dark:text-gray-100 flex justify-between items-center">
            <span>Notifications</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  router.push("/dashboard/notifications");
                  setOpen(false);
                }}
                className="text-xs h-6 px-2"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View All
              </Button>
            </div>
          </div>

          <ul className="max-h-64 overflow-y-auto">
            {shouldShowLoading ? (
              // Show loading skeleton
              <>
                <div className="p-2 bg-yellow-100 text-yellow-800 text-xs text-center">
                  Loading state - shouldShowLoading:{" "}
                  {shouldShowLoading.toString()}
                </div>
                {Array.from({ length: 3 }).map((_, index) => (
                  <NotificationSkeleton key={`skeleton-${index}`} />
                ))}
              </>
            ) : error ? (
              <li className="p-4 text-center text-red-500 dark:text-red-400">
                <div className="p-2 bg-red-100 text-red-800 text-xs mb-2">
                  Error - {error.message}
                </div>
                <p className="text-sm">Failed to load notifications</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetch()}
                  className="mt-2 text-xs"
                >
                  Retry
                </Button>
              </li>
            ) : notifications.length === 0 ? (
              <>
                <div className="p-2 bg-blue-100 text-blue-800 text-xs text-center">
                  No notifications found
                </div>
                <li className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No notifications
                </li>
              </>
            ) : (
              <>
                <div className="p-2 text-gray-800 dark:text-white text-xs text-center border-b">
                  Showing {notifications.length} notifications ({unreadCount}{" "}
                  unread)
                </div>
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={`flex items-start border-b justify-between px-4 py-3 hover:bg-purple-50 dark:hover:bg-gray-800 transition cursor-pointer ${
                      // CHANGED: Only highlight unread notifications
                      !notification.read ? "bg-blue-50 dark:bg-blue-900/20" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm ${
                            // CHANGED: Style unread notifications differently
                            !notification.read
                              ? "font-medium text-gray-900 dark:text-white"
                              : "text-gray-600 dark:text-gray-300"
                          }`}
                        >
                          {notification.message}
                        </p>
                        {notification.amount && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Amount: {notification.amount}{" "}
                            {notification.currency}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {new Date(notification.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {/* CHANGED: Only show X button for unread notifications */}
                    {!notification.read && (
                      <div
                        className="ml-2 flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                        onClick={(e) =>
                          handleClearNotification(notification.id, e)
                        }
                        title="Mark as read"
                      >
                        <X className="h-4 w-4 text-gray-400 hover:text-red-500 transition-colors" />
                      </div>
                    )}
                  </li>
                ))}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
