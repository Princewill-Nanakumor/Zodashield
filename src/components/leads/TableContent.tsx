import { Table as TanstackTable, flexRender } from "@tanstack/react-table";
import { Lead, Status } from "@/types/leads";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

interface TableContentProps {
  table: TanstackTable<Lead>;
  onRowClick: (lead: Lead, event: React.MouseEvent) => void;
  selectedLead: Lead | null;
  isLoading?: boolean;
}

// Loading Skeleton Components
const TableHeaderSkeleton = ({ columnCount }: { columnCount: number }) => (
  <TableHeader className="bg-gray-100 dark:bg-gray-800">
    <TableRow>
      {Array.from({ length: columnCount }).map((_, index) => (
        <TableHead
          key={`skeleton-header-${index}`}
          className={`text-gray-700 dark:text-gray-300 font-semibold text-left ${
            index === 0
              ? "w-12 px-3 border-r border-gray-200 dark:border-gray-700"
              : "px-4"
          }`}
        >
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </TableHead>
      ))}
    </TableRow>
  </TableHeader>
);

const TableRowSkeleton = ({
  columnCount,
  isLast,
}: {
  columnCount: number;
  isLast: boolean;
}) => (
  <TableRow className="bg-white dark:bg-gray-800">
    {Array.from({ length: columnCount }).map((_, index) => (
      <TableCell
        key={`skeleton-cell-${index}`}
        className={`
          py-3.5
          ${
            index === 0
              ? "px-3 border-r border-gray-200 dark:border-gray-700"
              : "px-4"
          }
          border-b border-gray-200 dark:border-gray-700
          ${isLast ? "border-b-2" : ""}
        `}
      >
        <div className="flex items-center space-x-2">
          {index === 0 && (
            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          )}
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-1"></div>
        </div>
      </TableCell>
    ))}
  </TableRow>
);

const TableSkeleton = ({
  columnCount,
  rowCount = 5,
}: {
  columnCount: number;
  rowCount?: number;
}) => (
  <>
    <TableHeaderSkeleton columnCount={columnCount} />
    <TableBody className="dark:bg-gray-900">
      {Array.from({ length: rowCount }).map((_, index) => (
        <TableRowSkeleton
          key={`skeleton-row-${index}`}
          columnCount={columnCount}
          isLast={index === rowCount - 1}
        />
      ))}
    </TableBody>
  </>
);

export function TableContent({
  table,
  onRowClick,
  selectedLead,
  isLoading = false,
}: TableContentProps) {
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isStatusLoading, setIsStatusLoading] = useState(true);

  // Helper to format date as DD/MM/YYYY
  const formatDateDMY = (dateString: string) => {
    const date = new Date(dateString);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const fetchStatuses = useCallback(async () => {
    try {
      setIsStatusLoading(true);
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
      setIsStatusLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const getStatusStyle = (leadStatus: string) => {
    const status = statuses.find((s) => s._id === leadStatus);
    if (!status) {
      return {
        backgroundColor: "#3B82F615",
        color: "#3B82F6",
        borderColor: "#3B82F630",
      };
    }
    return {
      backgroundColor: `${status.color}15`,
      color: status.color,
      borderColor: `${status.color}30`,
    };
  };

  const renderStatus = (leadStatus: string) => {
    if (isStatusLoading) {
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1.5 dark:border-gray-700"
        >
          <Loader2 className="h-3 w-3 animate-spin dark:text-gray-400" />
          <span className="dark:text-gray-400">Loading...</span>
        </Badge>
      );
    }

    const status = statuses.find((s) => s._id === leadStatus);
    const statusColor = status?.color || "#3B82F6";
    const statusName = status?.name || "New";

    return (
      <Badge
        variant="outline"
        style={getStatusStyle(leadStatus)}
        className="flex items-center gap-1.5 dark:border-gray-700"
      >
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: statusColor }}
        />
        <span className="dark:text-gray-300">{statusName}</span>
      </Badge>
    );
  };

  const generateUniqueKey = (prefix: string, id: string, suffix?: string) => {
    return `${prefix}-${id}${suffix ? `-${suffix}` : ""}`;
  };

  const showLoadingState = isLoading || isStatusLoading;
  const columnCount = table.getAllColumns().length;

  // Show skeleton when loading
  if (showLoadingState) {
    return <TableSkeleton columnCount={columnCount} rowCount={5} />;
  }

  return (
    <>
      <TableHeader className="bg-gray-100 border-l-4  dark:bg-gray-800">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={generateUniqueKey("header-group", headerGroup.id)}>
            {headerGroup.headers.map((header) => {
              const isSelectColumn = header.column.id === "select";
              return (
                <TableHead
                  key={generateUniqueKey("header", header.id)}
                  className={`
                    text-gray-700  dark:text-gray-300 font-semibold text-left
                    ${
                      isSelectColumn
                        ? "w-12 px-3 border-r border-gray-200 dark:border-gray-700"
                        : "px-4"
                    }
                  `}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody className="dark:bg-gray-900 border-l-4 ">
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row, idx, arr) => {
            const lead = row.original;
            const isSelected = selectedLead && lead._id === selectedLead._id;
            const isLastRow = idx === arr.length - 1;
            return (
              <TableRow
                key={row.id}
                data-state={isSelected ? "selected" : undefined}
                onClick={(event) => {
                  const firstCell = event.currentTarget.querySelector("td");
                  if (firstCell && firstCell.contains(event.target as Node)) {
                    return;
                  }
                  onRowClick(lead, event);
                }}
                className={`
                  cursor-pointer transition-colors duration-150 ease-in-out
                  border-l-4 border-b
                  ${
                    isSelected
                      ? "bg-blue-50 dark:bg-gray-600 border-purple-500 dark:border-purple-500 font-bold"
                      : "bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700/80 border-l-transparent border-gray-200 dark:border-gray-700"
                  }
                `}
                style={
                  isSelected ? { borderBottom: "2px solid #9333ea" } : undefined
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={`
                      py-3.5
                      ${
                        isSelected
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-800 dark:text-gray-300"
                      }
                      ${
                        cell.column.id === "select"
                          ? "px-3 border-r border-gray-200 dark:border-gray-700"
                          : "px-4"
                      }
                      border-b border-gray-200 dark:border-gray-700
                      ${isLastRow ? "border-b-2" : ""}
                    `}
                  >
                    {cell.column.id === "status"
                      ? renderStatus(lead.status)
                      : cell.column.id === "createdAt"
                        ? formatDateDMY(lead.createdAt)
                        : flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                  </TableCell>
                ))}
              </TableRow>
            );
          })
        ) : (
          <TableRow>
            <TableCell
              colSpan={table.getAllColumns().length}
              className="h-24 text-center text-gray-600 dark:text-gray-400 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
            >
              No results found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </>
  );
}
