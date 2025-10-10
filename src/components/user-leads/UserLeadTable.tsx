// src/components/user-leads/UserLeadTable.tsx
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
import { Loader2, ArrowUpDown, Eye } from "lucide-react";
import { Lead } from "@/types/leads";
import { useStatuses } from "@/hooks/useStatuses"; // Import the new hook
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// Define the actual status format from API
interface Status {
  _id: string;
  name: string;
  color: string;
  createdAt?: string;
  updatedAt?: string;
}

function LoadingRow() {
  return (
    <TableRow>
      <TableCell colSpan={8} className="h-24 text-center">
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
        colSpan={8}
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
  statuses: Status[];
  statusesLoading: boolean;
}

function UserLeadRow({
  lead,
  onLeadClick,
  selectedLead,
  statuses,
  statusesLoading,
}: UserLeadRowProps) {
  const isSelected = selectedLead?._id === lead._id;

  // Find the current status from the passed statuses
  const currentStatus = statuses.find((s) => s._id === lead.status) ||
    statuses.find((s) => s._id === "NEW") || {
      _id: "NEW",
      name: "New",
      color: "#3B82F6",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

  const getStatusStyle = () => {
    return {
      backgroundColor: `${currentStatus.color}15`,
      color: currentStatus.color,
      borderColor: `${currentStatus.color}30`,
    };
  };

  const renderStatus = () => {
    if (statusesLoading) {
      return (
        <Badge variant="outline" className="flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading...
        </Badge>
      );
    }

    return (
      <Badge
        variant="outline"
        style={getStatusStyle()}
        className="flex items-center gap-1.5"
      >
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: currentStatus.color }}
        />
        {currentStatus.name}
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

  // Get current URL params to preserve filters when navigating
  const searchParams = useSearchParams();
  const currentParams = searchParams.toString();

  // Preserve current filters in the URL
  const detailUrl = currentParams
    ? `/dashboard/leads/${lead._id}?${currentParams}`
    : `/dashboard/leads/${lead._id}`;

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
        <div className="flex items-center justify-center">
          <Link
            href={detailUrl}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:border dark:border-gray-700 transition-colors duration-200"
            title="View Details"
          >
            <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </Link>
        </div>
      </TableCell>
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
  // Use React Query hook for statuses - this will cache the data!
  const { statuses, isLoading: statusesLoading } = useStatuses();

  const SortableHeader = ({
    field,
    children,
  }: {
    field: SortField;
    children: React.ReactNode;
  }) => (
    <TableHead className="text-gray-900 dark:text-white">
      <Button
        variant="ghost"
        onClick={() => onSort(field)}
        className="h-8 flex items-center gap-1 text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-200"
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
      <TableHeader className="bg-gray-100 dark:bg-gray-700">
        <TableRow>
          <TableHead className="text-center text-gray-900 dark:text-white">
            Actions
          </TableHead>
          <SortableHeader field="name">Name</SortableHeader>
          <TableHead className="text-gray-900 dark:text-white">Email</TableHead>
          <TableHead className="text-gray-900 dark:text-white">Phone</TableHead>
          <SortableHeader field="country">Country</SortableHeader>
          <SortableHeader field="status">Status</SortableHeader>
          <SortableHeader field="source">Source</SortableHeader>
          <TableHead className="text-gray-900 dark:text-white">
            Assigned To
          </TableHead>
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
              key={`${lead._id}-${lead.status}`}
              lead={lead}
              onLeadClick={onLeadClick}
              selectedLead={selectedLead}
              statuses={statuses}
              statusesLoading={statusesLoading}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
}
