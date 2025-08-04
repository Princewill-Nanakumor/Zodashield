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

// Loading skeleton component for notification dropdown
const NotificationSkeleton = () => (
  <li className="flex items-start justify-between px-4 py-3 animate-pulse">
    <div className="flex items-start space-x-3 flex-1">
      {/* Icon skeleton */}
      <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
      <div className="flex-1 min-w-0">
        {/* Message skeleton */}
        <div className="space-y-1">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
        {/* Amount skeleton */}
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-20 mt-1"></div>
        {/* Date skeleton */}
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-16 mt-1"></div>
      </div>
    </div>
    {/* X button skeleton */}
    <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded ml-2 flex-shrink-0"></div>
  </li>
);

export function NotificationBell() {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [showSkeletonOnOpen, setShowSkeletonOnOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Fetch notifications using React Query
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
    isFetching,
    isRefetching,
    isStale,
  } = useQuery({
    queryKey: ["notifications"],
    queryFn: async (): Promise<Notification[]> => {
      const response = await fetch("/api/notifications", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch notifications");
      }
      return response.json();
    },
    enabled: !!session?.user,
    staleTime: 10000, // Consider data stale after 10 seconds
    refetchInterval: 60000, // Refetch every 60 seconds
    refetchIntervalInBackground: false, // Only refetch when tab is active
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch on mount
    retry: 1, // Reduce retry attempts
  });

  // Handle dropdown opening - show skeleton if data is stale or no data
  const handleDropdownToggle = useCallback(() => {
    if (!open) {
      // Opening dropdown - check if we should show loading state
      const shouldShowLoading = isStale || !notifications.length || isFetching;

      if (shouldShowLoading) {
        setShowSkeletonOnOpen(true);
        // Trigger immediate refetch if data is stale
        if (isStale) {
          refetch();
        }
      } else {
        setShowSkeletonOnOpen(false);
      }
    }
    setOpen((prev) => !prev);
  }, [open, isStale, notifications.length, isFetching, refetch]);

  // Reset skeleton state when data loads
  useEffect(() => {
    if (!isLoading && !isFetching && !isRefetching) {
      setShowSkeletonOnOpen(false);
    }
  }, [isLoading, isFetching, isRefetching]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setShowSkeletonOnOpen(false);
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
    try {
      // Mark notification as read
      await fetch(`/api/notifications/${notification.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ read: true }),
      });

      // Update the cache optimistically
      queryClient.setQueryData(
        ["notifications"],
        (oldData: Notification[] = []) =>
          oldData.filter((n) => n.id !== notification.id)
      );

      // Navigate to correct payment details page using dynamic route
      if (notification.link) {
        // Extract payment ID from the link
        const paymentIdMatch = notification.link.match(/\/payments\/([^\/]+)$/);
        if (paymentIdMatch) {
          const paymentId = paymentIdMatch[1];
          // Redirect to the new dynamic route
          router.push(`/dashboard/payment-details/${paymentId}`);
        } else {
          // Fallback to original link if pattern doesn't match
          router.push(notification.link);
        }
      }
      setOpen(false);
      setShowSkeletonOnOpen(false);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      // Refetch on error to ensure consistency
      refetch();
    }
  };

  const handleDeleteNotification = useCallback(
    async (notificationId: string, event: React.MouseEvent) => {
      event.stopPropagation();
      try {
        await fetch(`/api/notifications/${notificationId}`, {
          method: "DELETE",
          credentials: "include",
        });

        // Update the cache optimistically
        queryClient.setQueryData(
          ["notifications"],
          (oldData: Notification[] = []) =>
            oldData.filter((n) => n.id !== notificationId)
        );
      } catch (error) {
        console.error("Error deleting notification:", error);
        // Refetch on error to ensure consistency
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

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Determine if we should show loading state
  const shouldShowLoading =
    showSkeletonOnOpen || (isLoading && notifications.length === 0);

  // Calculate appropriate number of skeleton items
  const getSkeletonCount = () => {
    // If we have existing notifications, show the same number of skeletons
    if (notifications.length > 0) {
      return Math.min(notifications.length, 5); // Cap at 5 to avoid too many skeletons
    }
    // If no notifications yet (first load), show 2-3 skeletons as placeholder
    return 2;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative p-2 rounded-full hover:bg-purple-400 dark:hover:bg-gray-800 transition"
        aria-label="Notifications"
        type="button"
        onClick={handleDropdownToggle}
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
                onClick={() => {
                  router.push("/dashboard/notifications");
                  setOpen(false);
                  setShowSkeletonOnOpen(false);
                }}
                className="text-xs h-6 px-2"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View All
              </Button>
              {(isFetching || isRefetching) && (
                <div className="inline-block">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                </div>
              )}
            </div>
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {shouldShowLoading ? (
              // Loading skeleton - show appropriate number based on existing notifications
              <>
                {Array.from({ length: getSkeletonCount() }).map((_, index) => (
                  <NotificationSkeleton key={`skeleton-${index}`} />
                ))}
              </>
            ) : error ? (
              <li className="p-4 text-center text-red-500 dark:text-red-400">
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
