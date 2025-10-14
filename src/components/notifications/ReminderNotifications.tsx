// src/components/notifications/ReminderNotifications.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Bell, X, Clock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reminder } from "@/types/leads";
import { useRouter } from "next/navigation";
import { playNotificationSound } from "@/lib/notificationSound";

export default function ReminderNotifications() {
  const { status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Reminder[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);

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

  // Poll for due reminders
  const { data: dueReminders = [] } = useQuery({
    queryKey: ["dueReminders"],
    queryFn: async (): Promise<Reminder[]> => {
      const response = await fetch("/api/reminders/check-due");
      if (!response.ok) return [];
      return response.json();
    },
    enabled: status === "authenticated",
    refetchInterval: 60 * 1000, // Check every minute
    staleTime: 30 * 1000,
  });

  // Show notifications when new due reminders arrive
  useEffect(() => {
    if (dueReminders.length > 0) {
      dueReminders.forEach((reminder) => {
        // Play sound if enabled for this reminder
        if (reminder.soundEnabled) {
          playNotificationSound();
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
            silent: !reminder.soundEnabled, // Mute browser notification sound if disabled
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

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  }, []);

  const handleNotificationClick = useCallback(
    (reminder: Reminder) => {
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
                  onClick={() => dismissNotification(reminder._id)}
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
