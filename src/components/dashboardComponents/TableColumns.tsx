// src/components/dashboardComponents/TableColumns.tsx
"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Lead } from "@/types/leads";
import { User } from "@/types/user.types";

type SortField =
  | "name"
  | "country"
  | "status"
  | "source"
  | "createdAt"
  | "assignedTo";

// Memoized status styles to prevent recreation
const STATUS_STYLES = {
  NEW: {
    backgroundColor: "#EEF2FF",
    color: "#3B82F6",
    dotColor: "#3B82F6",
    label: "New",
  },
  CALLBACK: {
    backgroundColor: "#ECFDF5",
    color: "#059669",
    dotColor: "#059669",
    label: "Callback",
  },
  NO_INTEREST: {
    backgroundColor: "#FEF2F2",
    color: "#DC2626",
    dotColor: "#DC2626",
    label: "No interest",
  },
  IN_PROGRESS: {
    backgroundColor: "#FDF5EE",
    color: "#EA580C",
    dotColor: "#EA580C",
    label: "In Progress",
  },
} as const;

const getStatusStyle = (status: string) => {
  const upperStatus = status?.toUpperCase();
  return (
    STATUS_STYLES[upperStatus as keyof typeof STATUS_STYLES] ||
    STATUS_STYLES.NEW
  );
};

interface TableColumnsProps {
  sortField: SortField;
  handleSort: (field: SortField) => void;
  allSelected: boolean;
  selectedLeads: Lead[];
  handleSelectAll: (checked: boolean) => void;
  handleRowSelection: (lead: Lead, checked: boolean) => void;
  users: User[];
  selectAllRef: React.RefObject<HTMLInputElement | null>;
}

export const useTableColumns = ({
  sortField,
  handleSort,
  allSelected,
  selectedLeads,
  handleSelectAll,
  handleRowSelection,
  users,
  selectAllRef,
}: TableColumnsProps) => {
  const columns = useMemo<ColumnDef<Lead>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              ref={selectAllRef}
              checked={allSelected}
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        ),
        cell: ({ row }) => {
          const lead = row.original;
          const isSelected = lead._id
            ? selectedLeads.some((l) => l._id === lead._id)
            : false;

          return (
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => handleRowSelection(lead, e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: "name",
        header: () => (
          <Button
            variant="ghost"
            onClick={() => handleSort("name")}
            className="h-8 flex items-center gap-1"
          >
            <span className={sortField === "name" ? "font-bold" : ""}>
              Name
            </span>
            <ArrowUpDown
              className={`h-4 w-4 ${
                sortField === "name"
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            />
          </Button>
        ),
        cell: ({ row }) => {
          const lead = row.original;
          return (
            <div className="font-medium">
              {lead.name ||
                `${lead.firstName || ""} ${lead.lastName || ""}`.trim()}
            </div>
          );
        },
      },
      {
        id: "email",
        header: "Email",
        cell: ({ row }) => row.original.email,
      },
      {
        id: "phone",
        header: "Phone",
        cell: ({ row }) => row.original.phone || "N/A",
      },
      {
        id: "country",
        header: () => (
          <Button
            variant="ghost"
            onClick={() => handleSort("country")}
            className="h-8 flex items-center gap-1"
          >
            <span className={sortField === "country" ? "font-bold" : ""}>
              Country
            </span>
            <ArrowUpDown
              className={`h-4 w-4 ${
                sortField === "country"
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            />
          </Button>
        ),
        cell: ({ row }) => row.original.country || "N/A",
      },
      {
        id: "status",
        header: () => (
          <Button
            variant="ghost"
            onClick={() => handleSort("status")}
            className="h-8 flex items-center gap-1"
          >
            <span className={sortField === "status" ? "font-bold" : ""}>
              Status
            </span>
            <ArrowUpDown
              className={`h-4 w-4 ${
                sortField === "status"
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            />
          </Button>
        ),
        cell: ({ row }) => {
          const lead = row.original;
          const statusStyle = getStatusStyle(lead.status);

          return (
            <Badge
              variant="outline"
              style={{
                backgroundColor: statusStyle.backgroundColor,
                color: statusStyle.color,
                border: "none",
                fontWeight: 500,
              }}
              className="flex items-center gap-1.5"
            >
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: statusStyle.dotColor }}
              />
              {statusStyle.label}
            </Badge>
          );
        },
      },
      {
        id: "source",
        header: () => (
          <Button
            variant="ghost"
            onClick={() => handleSort("source")}
            className="h-8 flex items-center gap-1"
          >
            <span className={sortField === "source" ? "font-bold" : ""}>
              Source
            </span>
            <ArrowUpDown
              className={`h-4 w-4 ${
                sortField === "source"
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            />
          </Button>
        ),
        cell: ({ row }) => row.original.source,
      },
      {
        id: "assignedTo",
        header: () => (
          <Button
            variant="ghost"
            onClick={() => handleSort("assignedTo")}
            className="h-8 flex items-center gap-1"
          >
            <span className={sortField === "assignedTo" ? "font-bold" : ""}>
              Assigned To
            </span>
            <ArrowUpDown
              className={`h-4 w-4 ${
                sortField === "assignedTo"
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            />
          </Button>
        ),
        cell: ({ row }) => {
          const lead = row.original;
          if (!lead.assignedTo) return "Unassigned";

          const userId =
            typeof lead.assignedTo === "string"
              ? lead.assignedTo
              : lead.assignedTo?.id || "";
          const user = users.find((u) => u.id === userId);
          return user ? `${user.firstName} ${user.lastName}` : "Unassigned";
        },
      },
      {
        id: "createdAt",
        header: () => (
          <Button
            variant="ghost"
            onClick={() => handleSort("createdAt")}
            className="h-8 flex items-center gap-1"
          >
            <span className={sortField === "createdAt" ? "font-bold" : ""}>
              Created
            </span>
            <ArrowUpDown
              className={`h-4 w-4 ${
                sortField === "createdAt"
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            />
          </Button>
        ),
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString(),
      },
    ],
    [
      sortField,
      handleSort,
      allSelected,
      selectedLeads,
      handleSelectAll,
      handleRowSelection,
      users,
      selectAllRef,
    ]
  );

  return { columns };
};
