"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { useStatuses } from "@/context/StatusContext";

interface LeadStatusProps {
  lead: Lead;
}

// Helper to add alpha to hex color
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
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>(lead.status);
  const queryClient = useQueryClient();

  // Use the StatusContext instead of fetching statuses locally
  const { statuses, isLoading: isLoadingStatuses } = useStatuses();

  // Opacity for dark mode
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

  // Keep currentStatus in sync with lead prop
  useEffect(() => {
    setCurrentStatus(lead.status);
  }, [lead.status]);

  const handleStatusChange = useCallback(
    async (newStatusId: string) => {
      if (!lead._id) return;

      // Don't update if status is the same
      if (currentStatus === newStatusId) return;

      console.log("Status update initiated:", {
        leadId: lead._id,
        oldStatus: currentStatus,
        newStatus: newStatusId,
      });

      // Optimistically update the UI
      const previousStatus = currentStatus;
      setCurrentStatus(newStatusId);
      setIsUpdating(true);

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`/api/leads/${lead._id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatusId }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to update status: ${response.status} - ${errorText}`
          );
        }

        const updatedLead = await response.json();
        setCurrentStatus(updatedLead.status);

        // Update store optimistically
        updateLeadOptimistically(lead._id, updatedLead);

        // Invalidate queries to refresh the table
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["statuses"],
            exact: false,
          }),
          queryClient.invalidateQueries({
            queryKey: ["leads"],
            exact: false,
          }),
        ]);

        console.log("Status update successful:", updatedLead.status);

        toast({
          title: "Status updated",
          description: `Lead status changed successfully.`,
          variant: "success",
        });
      } catch (error) {
        // Revert the status if the update failed
        setCurrentStatus(previousStatus);

        const errorMessage =
          error instanceof Error ? error.message : "Failed to update status";

        console.error("Status update failed:", errorMessage);

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsUpdating(false);
      }
    },
    [lead._id, currentStatus, updateLeadOptimistically, queryClient, toast]
  );

  // Find the current status object by ID (not name)
  const currentStatusObj = statuses.find((s) => s._id === currentStatus);
  const currentStatusColor = currentStatusObj?.color || "#3b82f6";

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
                    value={status._id} // Use status._id as the value
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
