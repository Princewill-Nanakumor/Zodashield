// src/components/notifications/ReminderNotifications.tsx
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Bell, X, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reminder } from "@/types/leads";
import { useRouter } from "next/navigation";
import { alarmSound, stopNotificationSound } from "@/lib/notificationSound";

export default function ReminderNotifications() {
  const { status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Reminder[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const soundPlayingRef = useRef<boolean>(false);

  // Request browser notification permission
  useEffect(() => {
    if (status === "authenticated" && "Notification" in window) {
      if (Notification.permission === "granted") {
        setPermissionGranted(true);
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          setPermissionGranted(permission === "granted");
        });
      }
    }
  }, [status]);

  // Poll for due reminders - check more frequently for better timing
  const { data: dueReminders = [] } = useQuery({
    queryKey: ["dueReminders"],
    queryFn: async (): Promise<Reminder[]> => {
      const response = await fetch("/api/reminders/check-due");
      if (!response.ok) return [];
      const data = await response.json();
      console.log("Due reminders check:", data);
      return data;
    },
    enabled: status === "authenticated",
    refetchInterval: 10 * 1000, // Check every 10 seconds for better timing
    staleTime: 5 * 1000,
  });

  // Show notifications when new due reminders arrive
  useEffect(() => {
    if (dueReminders.length > 0) {
      // Check if any reminder has sound enabled
      const hasSoundEnabled = dueReminders.some((r) => r.soundEnabled);

      dueReminders.forEach((reminder) => {
        // Start alarm sound if enabled (only once for all reminders)
        if (
          reminder.soundEnabled &&
          !soundPlayingRef.current &&
          hasSoundEnabled
        ) {
          alarmSound.start();
          soundPlayingRef.current = true;
        }

        // Show browser notification
        if (permissionGranted && "Notification" in window) {
          const leadName =
            typeof reminder.leadId === "object"
              ? `${reminder.leadId.firstName} ${reminder.leadId.lastName}`
              : "Lead";

          const notification = new Notification("Reminder: " + reminder.title, {
            body: `${reminder.type} - ${leadName}\n${reminder.description || ""}`,
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            tag: reminder._id,
            requireInteraction: true,
            silent: true, // We control sound manually
          });

          notification.onclick = () => {
            window.focus();
            if (typeof reminder.leadId === "object") {
              router.push(`/dashboard/all-leads/${reminder.leadId._id}`);
            }
            notification.close();
          };
        }

        // Add to in-app notifications
        setNotifications((prev) => {
          const exists = prev.find((n) => n._id === reminder._id);
          if (!exists) {
            return [...prev, reminder];
          }
          return prev;
        });
      });
    }
  }, [dueReminders, permissionGranted, router]);

  // Stop sound when all notifications are dismissed
  useEffect(() => {
    if (notifications.length === 0 && soundPlayingRef.current) {
      stopNotificationSound();
      soundPlayingRef.current = false;
    }
  }, [notifications]);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n._id !== id);
      // Stop sound when last notification is dismissed
      if (updated.length === 0 && soundPlayingRef.current) {
        stopNotificationSound();
        soundPlayingRef.current = false;
      }
      return updated;
    });
  }, []);

  const handleNotificationClick = useCallback(
    (reminder: Reminder) => {
      // Stop sound when user interacts
      if (soundPlayingRef.current) {
        stopNotificationSound();
        soundPlayingRef.current = false;
      }

      if (typeof reminder.leadId === "object") {
        router.push(`/dashboard/all-leads/${reminder.leadId._id}`);
      }
      dismissNotification(reminder._id);
    },
    [router, dismissNotification]
  );

  if (notifications.length === 0) return null;

  return (
    <div className=" border-t mt-2 fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((reminder) => (
        <div
          key={reminder._id}
          className="bg-white dark:bg-gray-800 border-l-4 border-indigo-500 rounded-lg shadow-lg p-4 animate-slide-in-right"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-shake-bell" />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    {reminder.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {reminder.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    {reminder.reminderTime}
                    {typeof reminder.leadId === "object" && (
                      <span>
                        • {reminder.leadId.firstName} {reminder.leadId.lastName}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => {
                    // Stop sound when dismissing
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
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleNotificationClick(reminder)}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
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
