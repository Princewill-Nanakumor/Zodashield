"use client";

import { FC, useState, useEffect } from "react";
import { Lead } from "@/types/leads";
import { CheckCircle, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useStatuses } from "@/context/StatusContext";

interface LeadStatusProps {
  lead: Lead | null;
  onStatusChange: (updatedLead: Lead) => Promise<void>;
}

export const LeadStatus: FC<LeadStatusProps> = ({ lead, onStatusChange }) => {
  const { toast } = useToast();
  const { statuses, isLoading: isLoadingStatuses } = useStatuses();
  const [currentStatus, setCurrentStatus] = useState<string>("NEW");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (lead?.status) {
      setCurrentStatus(lead.status);
    }
  }, [lead?.status]);

  const getStatusColor = (statusId: string): string => {
    const status = statuses.find((s) => s._id === statusId);
    return status?.color || "#3B82F6";
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!lead?._id) {
      console.error("Invalid lead data:", lead);
      return;
    }

    // Prevent updating if it's the same status
    if (newStatus === currentStatus) {
      return;
    }

    setIsUpdating(true);
    try {
      // Call the dedicated status API instead of general update
      const response = await fetch(`/api/leads/${lead._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      const updatedLead = await response.json();

      // Call the parent's onStatusChange with the updated lead
      await onStatusChange(updatedLead);
      setCurrentStatus(newStatus);
    } catch (error) {
      console.error("Error updating status:", error);
      // Revert to the original status on error
      setCurrentStatus(lead.status);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!lead || !lead._id) {
    console.error("Invalid lead data:", lead);
    return null;
  }

  const currentStatusColor = getStatusColor(currentStatus);

  return (
    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
      <div className="w-5 h-5 text-gray-400 dark:text-gray-500">
        <CheckCircle className="w-4 h-4" />
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
                {statuses.find((s) => s._id === currentStatus)?.name || "New"}
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
