// src/components/user-leads/UserLeadRow.tsx
"use client";

import { TableCell, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Lead, Status } from "@/types/leads";
import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

interface UserLeadRowProps {
  lead: Lead;
  onLeadClick: (lead: Lead) => void;
  onContact: (type: "phone" | "email", lead: Lead) => void;
  selectedLead: Lead | null;
}

export function UserLeadRow({
  lead,
  onLeadClick,
  selectedLead,
}: UserLeadRowProps) {
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [currentStatus, setCurrentStatus] = useState<Status | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isSelected = selectedLead?._id === lead._id;

  const fetchStatuses = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/statuses");
      if (!response.ok) throw new Error("Failed to fetch statuses");
      let data = await response.json();

      const hasNewStatus = data.some((status: Status) => status._id === "NEW");
      if (!hasNewStatus) {
        data.unshift({
          _id: "NEW",
          id: "NEW", // Add the required id property
          name: "New",
          color: "#3B82F6",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      data = data.sort((a: Status, b: Status) => {
        if (a._id === "NEW") return -1;
        if (b._id === "NEW") return 1;
        return (
          new Date(b.createdAt || new Date()).getTime() -
          new Date(a.createdAt || new Date()).getTime()
        );
      });

      setStatuses(data);
    } catch (error) {
      console.error("Error fetching statuses:", error);
      toast({
        title: "Error",
        description: "Failed to load statuses 3",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  useEffect(() => {
    if (statuses.length > 0) {
      let status = statuses.find((s) => s._id === lead.status);
      if (!status && lead.status !== "NEW") {
        status =
          statuses.find((s) => s._id === "NEW") ||
          ({
            _id: "NEW",
            id: "NEW", // Add the required id property
            name: "New",
            color: "#3B82F6",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as Status); // Add type assertion
      }
      setCurrentStatus(status || null);
    }
  }, [lead.status, statuses]);

  const getStatusStyle = () => {
    if (!currentStatus) {
      return {
        backgroundColor: "hsl(var(--primary)/0.1)",
        color: "hsl(var(--primary))",
        borderColor: "hsl(var(--primary)/0.3)",
      };
    }

    return {
      backgroundColor: `${currentStatus.color}15`,
      color: currentStatus.color,
      borderColor: `${currentStatus.color}30`,
    };
  };

  const renderStatus = () => {
    if (isLoading) {
      return (
        <Badge variant="outline" className="flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading...
        </Badge>
      );
    }

    const statusColor = currentStatus?.color || "hsl(var(--primary))";
    const statusName = currentStatus?.name || "New";

    return (
      <Badge
        variant="outline"
        style={getStatusStyle()}
        className="flex items-center gap-1.5"
      >
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: statusColor }}
        />
        {statusName}
      </Badge>
    );
  };

  // Helper function to get assigned user name
  const getAssignedUserName = () => {
    if (!lead.assignedTo) return "Unassigned";

    if (typeof lead.assignedTo === "string") {
      return lead.assignedTo;
    }

    if (lead.assignedTo.firstName && lead.assignedTo.lastName) {
      return `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`;
    }

    return "Unknown User";
  };

  return (
    <TableRow
      data-state={isSelected ? "selected" : undefined}
      className={`
        cursor-pointer transition-colors
        ${
          isSelected
            ? "bg-primary/20 dark:bg-primary/30 font-medium"
            : "hover:bg-gray-100 dark:hover:bg-gray-700/80"
        }
      `}
      onClick={() => onLeadClick(lead)}
    >
      <TableCell
        className={isSelected ? "dark:text-white" : "dark:text-gray-300"}
      >
        <div className="font-medium">
          {lead.firstName} {lead.lastName}
        </div>
      </TableCell>
      <TableCell
        className={isSelected ? "dark:text-white" : "dark:text-gray-300"}
      >
        <div className="flex items-center">
          <span>{lead.email}</span>
        </div>
      </TableCell>
      <TableCell
        className={isSelected ? "dark:text-white" : "dark:text-gray-300"}
      >
        <div className="flex items-center">
          <span>{lead.phone || "-"}</span>
        </div>
      </TableCell>
      <TableCell
        className={isSelected ? "dark:text-white" : "dark:text-gray-300"}
      >
        <span>{lead.country || "-"}</span>
      </TableCell>
      <TableCell>{renderStatus()}</TableCell>
      <TableCell
        className={isSelected ? "dark:text-white" : "dark:text-gray-300"}
      >
        <span>{lead.source}</span>
      </TableCell>
      <TableCell
        className={isSelected ? "dark:text-white" : "dark:text-gray-300"}
      >
        <span
          className={!lead.assignedTo ? "text-gray-500 dark:text-gray-400" : ""}
        >
          {getAssignedUserName()}
        </span>
      </TableCell>
    </TableRow>
  );
}
