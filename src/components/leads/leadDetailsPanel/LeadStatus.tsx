"use client";

import React, { useState, useEffect } from "react";
import { Lead } from "@/types/leads";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
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

const LeadStatus: React.FC<LeadStatusProps> = ({ lead }) => {
  const { toast } = useToast();
  const updateLeadOptimistically = useUpdateLeadOptimistically();
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>(lead.status);
  const queryClient = useQueryClient();

  // Helper to determine if a color is light
  const isLightColor = (hex: string) => {
    if (!hex || hex.length < 4) return false;
    const c = hex.substring(1);
    const num = parseInt(
      c.length === 3
        ? c
            .split("")
            .map((x) => x + x)
            .join("")
        : c,
      16
    );
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return (r * 299 + g * 587 + b * 114) / 1000 > 180;
  };

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
                backgroundColor: `${currentStatusColor}15`,
                borderColor: `${currentStatusColor}50`,
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: currentStatusColor }}
                />
                <SelectValue
                  className="font-medium"
                  style={{
                    color: currentStatusColor,
                  }}
                />
                {isUpdating && (
                  <Loader2 className="h-3 w-3 animate-spin ml-auto text-gray-500 dark:text-gray-400" />
                )}
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              {statuses.map((status) => {
                const isLight = isLightColor(status.color);
                const textColor = isLight ? "text-gray-900" : "text-white";

                return (
                  <SelectItem
                    key={status._id}
                    value={status._id}
                    className={`my-1 rounded-md transition-colors font-medium cursor-pointer ${textColor}`}
                    style={
                      {
                        backgroundColor: `${status.color}${isLight ? "99" : "D9"}`,
                        "--select-item-hover-bg": `${status.color}${isLight ? "40" : "55"}`,
                      } as React.CSSProperties
                    }
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      <span>{status.name}</span>
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
