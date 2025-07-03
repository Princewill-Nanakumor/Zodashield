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
import { useUpdateLeadOptimistically } from "@/stores/leadsStore"; // Add this import

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
  const updateLeadOptimistically = useUpdateLeadOptimistically(); // Add this hook
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>(lead.status);

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

  // Update currentStatus if lead prop changes
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
      if (!response.ok) {
        throw new Error("Failed to update status");
      }
      const updatedLead = await response.json();
      setCurrentStatus(updatedLead.status);

      // Update the store so the table reflects the change
      updateLeadOptimistically(lead._id, updatedLead);

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
  const currentStatusColor = currentStatusObj?.color || "#2563eb"; // default blue

  return (
    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
      <div className="w-5 h-5 text-gray-400 dark:text-gray-500">
        {/* You can use an icon here if you want */}
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</p>
        {isLoadingStatuses ? (
          <div className="flex items-center">
            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
          </div>
        ) : (
          <Select
            value={currentStatus}
            onValueChange={handleStatusChange}
            disabled={isUpdating}
          >
            <SelectTrigger
              className="w-[180px]"
              style={{
                backgroundColor: `${currentStatusColor}15`,
                color: currentStatusColor,
                borderColor: `${currentStatusColor}30`,
              }}
            >
              <SelectValue>
                {currentStatusObj?.name ||
                  statuses.find((s) => s._id === currentStatus)?.name ||
                  "New"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {statuses.map((status) => (
                <SelectItem
                  key={status._id}
                  value={status._id}
                  style={
                    {
                      backgroundColor: `${status.color}15`,
                      color: status.color,
                      "--select-item-hover-bg": `${status.color}25`,
                    } as React.CSSProperties
                  }
                  className="my-1 rounded-md hover:bg-[var(--select-item-hover-bg)] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: status.color }}
                    />
                    {status.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};

export default LeadStatus;
