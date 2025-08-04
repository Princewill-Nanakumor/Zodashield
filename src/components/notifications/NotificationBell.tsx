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
import { Notification } from "@/types/notifications";
import { Button } from "@/components/ui/button";

export function NotificationBell() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/notifications", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch notifications");
      const allNotifications: Notification[] = await response.json();

      // Client-side filtering removed as server-side handles it
      setNotifications(allNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []); // Removed unnecessary dependencies

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
    }
  }, [session, fetchNotifications]);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    if (session?.user) {
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [session, fetchNotifications]);

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

  const handleNotificationClick = useCallback(
    async (notification: Notification) => {
      try {
        // Mark notification as read
        await fetch(`/api/notifications/${notification.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ read: true }),
        });

        // Remove from local state
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id)
        );

        // Navigate to link if provided
        if (notification.link) {
          router.push(notification.link);
        }
        setOpen(false);
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    },
    [router]
  );

  const handleDeleteNotification = useCallback(
    async (notificationId: string, event: React.MouseEvent) => {
      event.stopPropagation();
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

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative p-2 rounded-full hover:bg-purple-400 dark:hover:bg-gray-800 transition"
        aria-label="Notifications"
        type="button"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Bell className="h-6 w-6 text-white dark:text-purple-300" />
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
                onClick={() => router.push("/dashboard/notifications")}
                className="text-xs h-6 px-2"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View All
              </Button>
              {isLoading && (
                <div className="inline-block">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                </div>
              )}
            </div>
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="p-4 text-center text-gray-500 dark:text-gray-400">
                No notifications
              </li>
            ) : (
              notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`flex items-start justify-between px-4 py-3 hover:bg-purple-50 dark:hover:bg-gray-800 transition cursor-pointer ${
                    !notification.read ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3 flex-1">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 dark:text-gray-100">
                        {notification.message}
                      </p>
                      {notification.amount && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Amount: {notification.amount} {notification.currency}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <X
                    className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0 hover:text-red-500 transition-colors"
                    onClick={(e) =>
                      handleDeleteNotification(notification.id, e)
                    }
                  />
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
