"use client";

import React, { useState, useEffect } from "react";
import { Lead } from "@/types/leads";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useUpdateLeadOptimistically } from "@/stores/leadsStore";
import { useQueryClient } from "@tanstack/react-query";

interface Status {
  _id: string;
  name: string;
  color: string;
}

interface LeadStatusProps {
  lead: Lead;
}

// Helper to add alpha to hex color (opacity: 0-255 as hex, e.g. "CC" or "B3")
function hexWithAlpha(hex: string, alpha: string) {
  if (!hex) return "#3b82f6" + alpha;
  if (hex.length === 7) return hex + alpha;
  if (hex.length === 4)
    return "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3] + alpha;
  return hex + alpha;
}

const LeadStatus: React.FC<LeadStatusProps> = ({ lead }) => {
  const { toast } = useToast();
  const updateLeadOptimistically = useUpdateLeadOptimistically();
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>(lead.status);
  const queryClient = useQueryClient();

  // Opacity for dark mode (hex alpha: "B3"=70%)
  const darkAlpha = "B3";

  // Detect dark mode
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const match = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(match.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    match.addEventListener("change", handler);
    return () => match.removeEventListener("change", handler);
  }, []);

  // Fetch statuses on mount
  useEffect(() => {
    const fetchStatuses = async () => {
      setIsLoadingStatuses(true);
      try {
        const res = await fetch("/api/statuses");
        if (!res.ok) throw new Error("Failed to fetch statuses");
        const data = await res.json();
        setStatuses(data);
      } catch {
        toast({
          title: "Error",
          description: "Failed to load statuses",
          variant: "destructive",
        });
      } finally {
        setIsLoadingStatuses(false);
      }
    };
    fetchStatuses();
  }, [toast]);

  // Keep currentStatus in sync with lead prop
  useEffect(() => {
    setCurrentStatus(lead.status);
  }, [lead.status]);

  const handleStatusChange = async (newStatusId: string) => {
    if (!lead._id) return;
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/leads/${lead._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatusId }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      const updatedLead = await response.json();
      setCurrentStatus(updatedLead.status);
      updateLeadOptimistically(lead._id, updatedLead);
      await queryClient.invalidateQueries({ queryKey: ["leads"] });
      toast({
        title: "Status updated",
        description: `Lead status changed successfully.`,
        variant: "success",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const currentStatusObj = statuses.find((s) => s._id === currentStatus);
  const currentStatusColor = currentStatusObj?.color || "#3b82f6";

  // Light mode: text is always white, bg is status color
  // Dark mode: text is always white, bg is faded status color
  const triggerBg = isDark
    ? hexWithAlpha(currentStatusColor, darkAlpha)
    : currentStatusColor;
  const triggerTextColor = "#fff";

  return (
    <div className="flex items-center">
      <div className="flex-1">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</p>
        {isLoadingStatuses ? (
          <div className="flex items-center">
            <Loader2 className="h-4 w-4 animate-spin text-gray-500 dark:text-gray-400" />
          </div>
        ) : (
          <Select
            value={currentStatus}
            onValueChange={handleStatusChange}
            disabled={isUpdating}
          >
            <SelectTrigger
              className="w-[200px] border rounded-md cursor-pointer dark:border-gray-600"
              style={{
                backgroundColor: triggerBg,
                color: triggerTextColor,
                borderColor: currentStatusColor,
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: "#fff",
                    border: `2px solid ${currentStatusColor}`,
                  }}
                />
                <span
                  className="font-medium"
                  style={{
                    color: triggerTextColor,
                  }}
                >
                  {currentStatusObj?.name ||
                    statuses.find((s) => s._id === currentStatus)?.name ||
                    "New"}
                </span>
                {isUpdating && (
                  <Loader2
                    className="h-3 w-3 animate-spin ml-auto"
                    style={{ color: triggerTextColor }}
                  />
                )}
              </div>
            </SelectTrigger>
            <SelectContent className="border-gray-200 dark:border-gray-700">
              {statuses.map((status) => {
                const itemBg = isDark
                  ? hexWithAlpha(status.color, darkAlpha)
                  : status.color;
                const textColor = "#fff";
                return (
                  <SelectItem
                    key={status._id}
                    value={status._id}
                    className="my-1 rounded-md transition-colors font-medium cursor-pointer"
                    style={{
                      backgroundColor: itemBg,
                      color: textColor,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: "#fff",
                          border: `2px solid ${status.color}`,
                        }}
                      />
                      <span style={{ color: textColor }}>{status.name}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};

export default LeadStatus;
