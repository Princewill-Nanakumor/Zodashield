// src/components/dashboardComponents/TableColumns.tsx
"use client";

import { useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Lead } from "@/types/leads";
import { User } from "@/types/user.types";

type SortField =
  | "name"
  | "country"
  | "status"
  | "source"
  | "createdAt"
  | "assignedTo";

// Default status style for fallback
const DEFAULT_STATUS_STYLE = {
  backgroundColor: "#EEF2FF",
  color: "#3B82F6",
  dotColor: "#3B82F6",
  label: "New",
};

const getStatusStyle = (
  status: string,
  statuses: Array<{ id: string; name: string; color?: string }> = []
) => {
  const statusObj = statuses.find((s) => s.id === status);

  if (statusObj && statusObj.color) {
    return {
      backgroundColor: `${statusObj.color}15`,
      color: statusObj.color,
      dotColor: statusObj.color,
      label: statusObj.name,
    };
  }

  // Fallback to default style
  return DEFAULT_STATUS_STYLE;
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
  statuses?: Array<{ id: string; name: string; color?: string }>;
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
  statuses = [],
}: TableColumnsProps) => {
  // Get current URL params to preserve filters when navigating
  const searchParams = useSearchParams();
  const currentParams = searchParams.toString();

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
                onChange={(e) => {
                  e.stopPropagation();
                  handleRowSelection(lead, e.target.checked);
                }}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: "actions",
        header: () => <div className="text-center font-medium">Actions</div>,
        cell: ({ row }) => {
          const lead = row.original;
          // Preserve current filters in the URL
          const detailUrl = currentParams
            ? `/dashboard/all-leads/${lead._id}?${currentParams}`
            : `/dashboard/all-leads/${lead._id}`;

          return (
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
          );
        },
        enableSorting: false,
        enableHiding: false,
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
          const statusStyle = getStatusStyle(lead.status, statuses);

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
      statuses,
      currentParams,
    ]
  );

  return { columns };
};
