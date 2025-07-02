"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowUpDown } from "lucide-react";
import { Lead, Status } from "@/types/leads";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

function LoadingRow() {
  return (
    <TableRow>
      <TableCell colSpan={7} className="h-24 text-center">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading leads...
        </div>
      </TableCell>
    </TableRow>
  );
}

function EmptyRow() {
  return (
    <TableRow>
      <TableCell
        colSpan={7}
        className="h-24 text-center text-gray-500 dark:text-gray-400"
      >
        No leads found
      </TableCell>
    </TableRow>
  );
}

interface UserLeadRowProps {
  lead: Lead;
  onLeadClick: (lead: Lead) => void;
  selectedLead: Lead | null;
}

function UserLeadRow({ lead, onLeadClick, selectedLead }: UserLeadRowProps) {
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
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      setStatuses(data);
    } catch (error) {
      console.error("Error fetching statuses:", error);
      toast({
        title: "Error",
        description: "Failed to load statuses",
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
        status = statuses.find((s) => s._id === "NEW") || {
          _id: "NEW",
          name: "New",
          color: "#3B82F6",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      setCurrentStatus(status || null);
    }
  }, [lead.status, statuses]);

  const getStatusStyle = () => {
    if (!currentStatus) {
      return {
        backgroundColor: "#3B82F615",
        color: "#3B82F6",
        borderColor: "#3B82F630",
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

    const statusColor = currentStatus?.color || "#3B82F6";
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
      onClick={() => onLeadClick(lead)}
      className={`
        cursor-pointer transition-colors
        ${
          isSelected
            ? "bg-primary/20 dark:bg-primary/30 font-bold"
            : "hover:bg-gray-100 dark:hover:bg-gray-700/80"
        }
      `}
    >
      <TableCell
        className={isSelected ? "dark:text-white" : "dark:text-gray-300"}
      >
        {lead.firstName} {lead.lastName}
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

type SortField = "name" | "country" | "status" | "source" | "createdAt";
type SortOrder = "asc" | "desc";

interface UserLeadTableProps {
  loading: boolean;
  paginatedLeads: Lead[];
  onLeadClick: (lead: Lead) => void;
  selectedLead: Lead | null;
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}

export function UserLeadTable({
  loading,
  paginatedLeads,
  onLeadClick,
  selectedLead,
  sortField,
  sortOrder,
  onSort,
}: UserLeadTableProps) {
  const SortableHeader = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <TableHead>
      <Button
        variant="ghost"
        onClick={() => onSort(field)}
        className="h-8 flex items-center gap-1"
      >
        {children}
        <ArrowUpDown
          className={`h-4 w-4 ${
            sortField === field
              ? sortOrder === "asc"
                ? "rotate-180"
                : ""
              : "text-muted-foreground"
          }`}
        />
      </Button>
    </TableHead>
  );

  return (
    <Table>
      <TableHeader className="bg-gray-100 dark:bg-gray-900">
        <TableRow>
          <SortableHeader field="name">Name</SortableHeader>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <SortableHeader field="country">Country</SortableHeader>
          <SortableHeader field="status">Status</SortableHeader>
          <SortableHeader field="source">Source</SortableHeader>
          <TableHead>Assigned To</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <LoadingRow />
        ) : paginatedLeads.length === 0 ? (
          <EmptyRow />
        ) : (
          paginatedLeads.map((lead: Lead) => (
            <UserLeadRow
              key={lead._id}
              lead={lead}
              onLeadClick={onLeadClick}
              selectedLead={selectedLead}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
}
