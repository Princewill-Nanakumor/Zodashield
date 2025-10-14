// src/components/leads/leadDetailsPanel/CommentsAndActivities.tsx
"use client";

import { FC, useState } from "react";
import { Lead } from "@/types/leads";
import { Notebook, Activity as ActivityIcon, Bell } from "lucide-react";
import Activities from "./Activities";
import CommentsTab from "./CommentsTab";
import RemindersTab from "./RemindersTab";
import { useQuery } from "@tanstack/react-query";
import { Reminder } from "@/types/leads";

interface CommentsAndActivitiesProps {
  lead: Lead;
  onLeadUpdated?: (updatedLead: Lead) => Promise<boolean>;
}

const CommentsAndActivities: FC<CommentsAndActivitiesProps> = ({ lead }) => {
  const [activeTab, setActiveTab] = useState<
    "comments" | "activity" | "reminders"
  >("comments");

  // Fetch reminders count for badge
  const { data: reminders = [] } = useQuery({
    queryKey: ["reminders", lead._id],
    queryFn: async (): Promise<Reminder[]> => {
      const response = await fetch(`/api/leads/${lead._id}/reminders`);
      if (!response.ok) {
        throw new Error(`Failed to fetch reminders: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!lead._id,
    staleTime: 0,
    refetchInterval: 60 * 1000,
  });

  const pendingRemindersCount = reminders.filter(
    (r) => r.status === "PENDING" || r.status === "SNOOZED"
  ).length;

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 h-full min-h-0">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("comments")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeTab === "comments"
                ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/50"
            }`}
          >
            <Notebook className="w-5 h-5" />
            Comments
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeTab === "activity"
                ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/50"
            }`}
          >
            <ActivityIcon className="w-5 h-5" />
            Activity
          </button>
          <button
            onClick={() => setActiveTab("reminders")}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              activeTab === "reminders"
                ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700/50"
            }`}
          >
            <Bell className="w-5 h-5" />
            Reminders
            {pendingRemindersCount > 0 && (
              <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                {pendingRemindersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* This is the scrollable/fill area */}
      <div className="flex-1 flex flex-col min-h-0">
        {activeTab === "comments" && <CommentsTab leadId={lead._id} />}
        {activeTab === "activity" && (
          <div className="flex-1 min-h-0 flex flex-col">
            <Activities leadId={lead._id} />
          </div>
        )}
        {activeTab === "reminders" && <RemindersTab leadId={lead._id} />}
      </div>
    </div>
  );
};

export default CommentsAndActivities;
