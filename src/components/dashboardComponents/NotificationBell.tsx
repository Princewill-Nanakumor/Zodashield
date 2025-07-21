"use client";
import React, { useState, useRef, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  message: string;
  role: "SUPER_ADMIN" | "ADMIN" | "AGENT" | "USER";
  link?: string; // e.g. "/dashboard/transactions"
  createdAt: string;
};

export function NotificationBell() {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Fetch notifications for the current user/role
  useEffect(() => {
    async function fetchNotifications() {
      // Replace with your real API endpoint and logic
      const res = await fetch("/api/notifications");
      const allNotifications: Notification[] = await res.json();

      // Filter notifications based on user role/email
      const userRole = session?.user?.role || "USER";
      const userEmail = session?.user?.email;
      const superAdminEmails =
        process.env.SUPER_ADMIN_EMAILS?.split(",").map((e) => e.trim()) || [];

      let filtered: Notification[] = [];
      if (userEmail && superAdminEmails.includes(userEmail)) {
        filtered = allNotifications.filter((n) => n.role === "SUPER_ADMIN");
      } else if (userRole === "ADMIN") {
        filtered = allNotifications.filter((n) => n.role === "ADMIN");
      } else if (userRole === "AGENT" || userRole === "USER") {
        filtered = allNotifications.filter(
          (n) => n.role === "AGENT" || n.role === "USER"
        );
      }
      setNotifications(filtered);
    }
    if (session?.user) fetchNotifications();
  }, [session]);

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

  const handleNotificationClick = (notification: Notification) => {
    // Optionally clear notification here (API call)
    setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    if (notification.link) {
      router.push(notification.link);
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative p-2 rounded-full hover:bg-purple-400 dark:hover:bg-gray-800 transition"
        aria-label="Notifications"
        type="button"
        onClick={() => setOpen((prev) => !prev)}
      >
        <Bell className="h-6 w-6 text-white dark:text-purple-300" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full px-1.5 py-0.5">
            {notifications.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-100 dark:border-gray-800 font-semibold text-gray-800 dark:text-gray-100">
            Notifications
          </div>
          <ul className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="p-4 text-center text-gray-500 dark:text-gray-400">
                No notifications
              </li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-purple-50 dark:hover:bg-gray-800 transition cursor-pointer"
                  onClick={() => handleNotificationClick(n)}
                >
                  <span className="text-sm text-gray-800 dark:text-gray-100">
                    {n.message}
                  </span>
                  <X
                    className="h-4 w-4 text-gray-400 ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setNotifications((prev) =>
                        prev.filter((x) => x.id !== n.id)
                      );
                    }}
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
