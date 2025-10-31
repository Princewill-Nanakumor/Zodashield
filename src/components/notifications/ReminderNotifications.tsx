// src/components/notifications/ReminderNotifications.tsx
"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Bell, X, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reminder } from "@/types/leads";
import { alarmSound, stopNotificationSound } from "@/lib/notificationSound";
import { formatTime24Hour } from "@/lib/utils";

export default function ReminderNotifications() {
  const { status } = useSession();
  const [notifications, setNotifications] = useState<Reminder[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const soundPlayingRef = useRef<boolean>(false);
  const lastReminderIdsRef = useRef<string>("");

  // Request browser notification permission
  useEffect(() => {
    if (status === "authenticated" && "Notification" in window) {
      if (Notification.permission === "granted") {
        setPermissionGranted(true);
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          setPermissionGranted(permission === "granted");
        });
      } else {
        setPermissionGranted(false);
      }
    }
  }, [status]);

  // Poll for due reminders
  const { data: dueReminders = [] } = useQuery<Reminder[]>({
    queryKey: ["dueReminders"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/reminders/check-due");
        if (!response.ok) {
          return [];
        }
        return await response.json();
      } catch (error) {
        console.error("Error fetching due reminders:", error);
        return [];
      }
    },
    enabled: status === "authenticated",
    refetchInterval: 10000, // Check every 10 seconds for accurate timing
    staleTime: 5000,
  });

  // Create a stable reminder IDs string for comparison
  const reminderIdsString = useMemo(() => {
    if (!dueReminders || dueReminders.length === 0) return "";
    return dueReminders
      .map((r) => r._id)
      .sort()
      .join(",");
  }, [dueReminders]);

  // Handle notification updates - only when dueReminders actually changes
  useEffect(() => {
    if (!dueReminders || dueReminders.length === 0) {
      setNotifications([]);
      if (soundPlayingRef.current) {
        stopNotificationSound();
        soundPlayingRef.current = false;
      }
      return;
    }

    // Only update if the reminders have actually changed
    if (reminderIdsString === lastReminderIdsRef.current) {
      return;
    }

    lastReminderIdsRef.current = reminderIdsString;

    // Update notifications with a stable reference
    setNotifications([...dueReminders]);

    // Handle sound
    const soundEnabledReminders = dueReminders.filter((r) => r.soundEnabled);

    if (soundEnabledReminders.length > 0 && !soundPlayingRef.current) {
      alarmSound.start();
      soundPlayingRef.current = true;
    }

    // Show browser notifications
    if (permissionGranted && "Notification" in window) {
      dueReminders.forEach((reminder) => {
        const leadName =
          typeof reminder.leadId === "object"
            ? `${reminder.leadId.firstName} ${reminder.leadId.lastName}`
            : "Lead";

        try {
          const notification = new Notification("Reminder: " + reminder.title, {
            body: `${reminder.type} - ${leadName}\n${reminder.description || ""}`,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            tag: reminder._id,
            requireInteraction: true,
            silent: true,
          });

          notification.onclick = () => {
            window.focus();
            if (typeof reminder.leadId === "object") {
              window.location.href = `/dashboard/all-leads/${reminder.leadId._id}`;
            }
            notification.close();
          };
        } catch (error) {
          console.error("Error creating browser notification:", error);
        }
      });
    }
  }, [reminderIdsString, permissionGranted]); // eslint-disable-line react-hooks/exhaustive-deps

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n._id !== id);
      if (updated.length === 0 && soundPlayingRef.current) {
        stopNotificationSound();
        soundPlayingRef.current = false;
      }
      return updated;
    });
  }, []);

  const handleNotificationClick = useCallback(
    (reminder: Reminder) => {
      if (soundPlayingRef.current) {
        stopNotificationSound();
        soundPlayingRef.current = false;
      }

      if (typeof reminder.leadId === "object" && reminder.leadId._id) {
        const leadId = reminder.leadId._id;
        const currentPath = window.location.pathname;

        if (currentPath.includes("/all-leads")) {
          // Admin leads page
          window.location.href = `/dashboard/all-leads/${leadId}`;
        } else {
          // User leads page
          window.location.href = `/dashboard/leads/${leadId}`;
        }
      }

      dismissNotification(reminder._id);
    },
    [dismissNotification]
  );

  const handleMarkAsComplete = useCallback(
    async (reminder: Reminder) => {
      try {
        if (soundPlayingRef.current) {
          stopNotificationSound();
          soundPlayingRef.current = false;
        }

        // Handle leadId being either string or object
        const leadId =
          typeof reminder.leadId === "object"
            ? reminder.leadId._id
            : reminder.leadId;

        const response = await fetch(
          `/api/leads/${leadId}/reminders/${reminder._id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "COMPLETED" }),
          }
        );

        if (response.ok) {
          dismissNotification(reminder._id);
        }
      } catch (error) {
        console.error("Error marking reminder as complete:", error);
      }
    },
    [dismissNotification]
  );

  // Don't render anything until authentication is complete
  if (status === "loading") {
    return null;
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed z-50 max-w-sm mt-2 space-y-2 border-t top-20 right-2">
      {notifications.map((reminder) => (
        <div
          key={reminder._id}
          className="p-4 bg-white border-l-4 border-indigo-500 rounded-lg shadow-lg dark:bg-gray-800 animate-slide-in-right"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg dark:bg-indigo-900/30">
              <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-shake-bell" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="mb-1 font-semibold text-gray-900 dark:text-gray-100">
                    {reminder.title}
                  </h4>
                  <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                    {reminder.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full dark:bg-blue-900/30 dark:text-blue-300">
                      {reminder.type}
                    </span>
                    <Clock className="w-3 h-3" />
                    {formatTime24Hour(reminder.reminderTime)}
                    {typeof reminder.leadId === "object" && (
                      <span>
                        • {reminder.leadId.firstName} {reminder.leadId.lastName}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (soundPlayingRef.current) {
                      stopNotificationSound();
                      soundPlayingRef.current = false;
                    }
                    dismissNotification(reminder._id);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  onClick={() => handleMarkAsComplete(reminder)}
                  className="text-white bg-green-500 hover:bg-green-600"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Mark as Complete
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleNotificationClick(reminder)}
                  className="text-white bg-indigo-500 hover:bg-indigo-600"
                >
                  View Lead
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
