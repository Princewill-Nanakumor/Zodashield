"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  useReactTable,
  getPaginationRowModel,
  getCoreRowModel,
  getSortedRowModel,
  ColumnDef,
} from "@tanstack/react-table";
import { EmptyStateAdminLeadsTable } from "@/components/dashboardComponents/EmptyStateAdminLeadsTable";
import LeadDetailsPanel from "@/components/dashboardComponents/LeadDetailsPanel";
import { Lead } from "@/types/leads";
import { User } from "@/types/user.types";
import { TableHeader as CustomTableHeader } from "@/components/leads/LeadsTable/TableHeader";
import { TableContent } from "@/components/leads/TableContent";
import { TablePagination } from "@/components/leads/TablePagination";
import { Table } from "@/components/ui/Table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLeadsStore } from "@/stores/leadsStore";
import { useRouter, useSearchParams } from "next/navigation";

interface LeadsTableProps {
  leads: Lead[];
  onLeadUpdated: (lead: Lead) => Promise<boolean>;
  isLoading?: boolean;
  users: User[];
  selectedLeads?: Lead[];
  onSelectionChange?: (leads: Lead[]) => void;
}

type SortField =
  | "name"
  | "country"
  | "status"
  | "source"
  | "createdAt"
  | "assignedTo";
type SortOrder = "asc" | "desc";

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

export default function LeadsTable({
  leads = [],
  onLeadUpdated,
  isLoading = false,
  users = [],
  selectedLeads = [],
  onSelectionChange,
}: LeadsTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    selectedLead,
    setSelectedLead,
    isPanelOpen,
    setIsPanelOpen,
    pageSize,
    pageIndex,
    sorting,
    setPageSize,
    setPageIndex,
    setSorting,
  } = useLeadsStore();

  const selectAllRef = useRef<HTMLInputElement>(null);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Memoized sorting function with stable dependencies
  const sortedLeads = useMemo(() => {
    if (!Array.isArray(leads) || leads.length === 0) return [];

    return [...leads].sort((a, b) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;

      switch (sortField) {
        case "name": {
          const getDisplayName = (lead: Lead) =>
            lead.name?.trim() ||
            `${lead.firstName ?? ""} ${lead.lastName ?? ""}`.trim();
          return (
            getDisplayName(a).localeCompare(getDisplayName(b)) * multiplier
          );
        }
        case "country":
          return (a.country || "").localeCompare(b.country || "") * multiplier;
        case "status":
          return (a.status || "").localeCompare(b.status || "") * multiplier;
        case "source":
          return (a.source || "").localeCompare(b.source || "") * multiplier;
        case "assignedTo": {
          const getAssignedUserName = (lead: Lead) => {
            if (!lead.assignedTo) return "";
            const userId =
              typeof lead.assignedTo === "string"
                ? lead.assignedTo
                : lead.assignedTo?.id || "";
            const user = users.find((u) => u.id === userId);
            return user ? `${user.firstName} ${user.lastName}`.trim() : "";
          };
          const nameA = getAssignedUserName(a);
          const nameB = getAssignedUserName(b);
          if (nameA === "" && nameB !== "") return -1 * multiplier;
          if (nameA !== "" && nameB === "") return 1 * multiplier;
          if (nameA === "" && nameB === "") return 0;
          return nameA.localeCompare(nameB) * multiplier;
        }
        case "createdAt":
          return (
            (new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime()) *
            multiplier
          );
        default:
          return 0;
      }
    });
  }, [leads, sortField, sortOrder, users]);

  // Memoized row selection state
  const rowSelection = useMemo(() => {
    const selection: Record<string, boolean> = {};
    selectedLeads.forEach((lead) => {
      if (lead._id) {
        selection[lead._id] = true;
      }
    });
    return selection;
  }, [selectedLeads]);

  // Memoized current page leads
  const currentPageLeads = useMemo(() => {
    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedLeads.slice(startIndex, endIndex);
  }, [sortedLeads, pageIndex, pageSize]);

  // Memoized selection states
  const { allSelected, someSelected } = useMemo(() => {
    const allSelected =
      currentPageLeads.length > 0 &&
      currentPageLeads.every((lead) =>
        selectedLeads.some((selected) => selected._id === lead._id)
      );
    const someSelected = currentPageLeads.some((lead) =>
      selectedLeads.some((selected) => selected._id === lead._id)
    );
    return { allSelected, someSelected };
  }, [currentPageLeads, selectedLeads]);

  // Set indeterminate state on the select all checkbox
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected && !allSelected;
    }
  }, [someSelected, allSelected]);

  // Stable selection handlers
  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (!onSelectionChange) return;

      if (checked) {
        const newSelectedLeads = [...selectedLeads];
        currentPageLeads.forEach((lead) => {
          if (
            lead._id &&
            !selectedLeads.some((selected) => selected._id === lead._id)
          ) {
            newSelectedLeads.push(lead);
          }
        });
        onSelectionChange(newSelectedLeads);
      } else {
        const newSelectedLeads = selectedLeads.filter(
          (selected) =>
            !currentPageLeads.some((lead) => lead._id === selected._id)
        );
        onSelectionChange(newSelectedLeads);
      }
    },
    [selectedLeads, currentPageLeads, onSelectionChange]
  );

  const handleSort = useCallback(
    (field: SortField) => {
      const newOrder =
        sortField === field && sortOrder === "asc" ? "desc" : "asc";
      setSortField(field);
      setSortOrder(newOrder);
      setSorting([{ id: field, desc: newOrder === "desc" }]);
    },
    [sortField, sortOrder, setSorting]
  );

  // Memoized URL update function
  const updateUrl = useCallback(
    (lead: Lead | null) => {
      const params = new URLSearchParams(searchParams);

      if (lead?._id) {
        params.set("lead", lead._id);
        params.set("name", `${lead.firstName || ""}-${lead.lastName || ""}`);
      } else {
        params.delete("lead");
        params.delete("name");
      }

      router.push(`${window.location.pathname}?${params.toString()}`, {
        scroll: false,
      });
    },
    [router, searchParams]
  );

  // Memoized columns with stable dependencies
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
                  if (!onSelectionChange || !lead._id) return;

                  if (e.target.checked) {
                    onSelectionChange([...selectedLeads, lead]);
                  } else {
                    onSelectionChange(
                      selectedLeads.filter((l) => l._id !== lead._id)
                    );
                  }
                }}
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
      onSelectionChange,
      handleSelectAll,
      users,
    ]
  );

  const table = useReactTable({
    data: sortedLeads,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      pagination: { pageSize, pageIndex },
      sorting,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: () => {
      // Handled by checkbox onChange handlers
    },
    onSortingChange: (updater) => {
      if (typeof updater === "function") {
        const newSorting = updater(sorting);
        setSorting(newSorting);
      } else {
        setSorting(updater);
      }
    },
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const newState = updater({ pageIndex, pageSize });
        setPageIndex(newState.pageIndex);
        setPageSize(newState.pageSize);
      } else {
        setPageIndex(updater.pageIndex);
        setPageSize(updater.pageSize);
      }
    },
    manualPagination: false,
    manualSorting: true,
  });

  // Stable event handlers
  const handleRowClick = useCallback(
    (lead: Lead) => {
      if (!lead?._id) return;
      setSelectedLead(lead);
      setIsPanelOpen(true);
      updateUrl(lead);
    },
    [setSelectedLead, setIsPanelOpen, updateUrl]
  );

  const handlePanelClose = useCallback(() => {
    setSelectedLead(null);
    setIsPanelOpen(false);
    updateUrl(null);
  }, [setSelectedLead, setIsPanelOpen, updateUrl]);

  const handleNavigate = useCallback(
    (direction: "prev" | "next") => {
      if (!selectedLead) return;

      const currentIndex = sortedLeads.findIndex(
        (lead) => lead._id === selectedLead._id
      );
      let newLead: Lead | null = null;

      if (direction === "prev" && currentIndex > 0) {
        newLead = sortedLeads[currentIndex - 1];
      } else if (
        direction === "next" &&
        currentIndex < sortedLeads.length - 1
      ) {
        newLead = sortedLeads[currentIndex + 1];
      }

      if (newLead) {
        setSelectedLead(newLead);
        updateUrl(newLead);
      }
    },
    [sortedLeads, selectedLead, setSelectedLead, updateUrl]
  );

  const currentIndex = selectedLead
    ? sortedLeads.findIndex((lead) => lead._id === selectedLead._id)
    : -1;

  if (isLoading) {
    return (
      <div className="p-4 rounded-lg shadow dark:bg-gray-800 dark:text-white flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  const showEmptyState = sortedLeads.length === 0;

  return (
    <>
      <div className="p-4 rounded-lg shadow dark:bg-gray-800 dark:text-white">
        <CustomTableHeader
          table={table}
          pageSize={pageSize}
          pageIndex={pageIndex}
          totalRows={sortedLeads.length}
        />
        <Table>
          {showEmptyState ? (
            <tbody>
              <tr>
                <td colSpan={columns.length}>
                  <EmptyStateAdminLeadsTable />
                </td>
              </tr>
            </tbody>
          ) : (
            <TableContent
              table={table}
              onRowClick={handleRowClick}
              selectedLead={selectedLead}
            />
          )}
        </Table>
        <TablePagination
          pageIndex={pageIndex}
          pageCount={table.getPageCount()}
          onPageChange={setPageIndex}
        />
      </div>

      {isPanelOpen && selectedLead && (
        <LeadDetailsPanel
          key={selectedLead._id}
          lead={selectedLead}
          isOpen={isPanelOpen}
          onLeadUpdated={onLeadUpdated}
          onClose={handlePanelClose}
          onNavigate={handleNavigate}
          hasPrevious={currentIndex > 0}
          hasNext={currentIndex < sortedLeads.length - 1}
        />
      )}
    </>
  );
}
