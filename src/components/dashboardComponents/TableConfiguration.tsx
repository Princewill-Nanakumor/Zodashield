"use client";

import {
  useReactTable,
  getPaginationRowModel,
  getCoreRowModel,
  getSortedRowModel,
  ColumnOrderState,
} from "@tanstack/react-table";
import { Lead } from "@/types/leads";
import { ColumnDef } from "@tanstack/react-table";

interface TableConfigurationProps {
  data: Lead[];
  columns: ColumnDef<Lead>[];
  pageSize: number;
  pageIndex: number;
  sorting: Array<{ id: string; desc: boolean }>;
  rowSelection: Record<string, boolean>;
  columnOrder: ColumnOrderState;
  setSorting: (sorting: Array<{ id: string; desc: boolean }>) => void;
  setPageIndex: (pageIndex: number) => void;
  setPageSize: (pageSize: number) => void;
  setColumnOrder: (columnOrder: ColumnOrderState) => void;
}

export const useTableConfiguration = ({
  data,
  columns,
  pageSize,
  pageIndex,
  sorting,
  rowSelection,
  columnOrder,
  setSorting,
  setPageIndex,
  setPageSize,
  setColumnOrder,
}: TableConfigurationProps) => {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      pagination: { pageSize, pageIndex },
      sorting,
      rowSelection,
      columnOrder,
    },
    onColumnOrderChange: (updater) => {
      if (typeof updater === "function") {
        const newOrder = updater(columnOrder);
        setColumnOrder(newOrder);
      } else {
        setColumnOrder(updater);
      }
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
      console.log("onPaginationChange triggered:", {
        updater,
        currentPageIndex: pageIndex,
        dataLength: data.length,
      });

      if (typeof updater === "function") {
        const newState = updater({ pageIndex, pageSize });

        // Only update if the page actually changed AND it's not being reset to 0
        if (newState.pageIndex !== pageIndex && newState.pageIndex > 0) {
          console.log("Updating pageIndex:", {
            from: pageIndex,
            to: newState.pageIndex,
          });
          setPageIndex(newState.pageIndex);
        } else if (newState.pageIndex === 0 && pageIndex !== 0) {
          console.log("Preventing automatic reset to page 0");
          // Don't update - prevent automatic reset to page 0
        }

        if (newState.pageSize !== pageSize) {
          setPageSize(newState.pageSize);
        }
      } else {
        // Only update if the page actually changed AND it's not being reset to 0
        if (updater.pageIndex !== pageIndex && updater.pageIndex > 0) {
          console.log("Updating pageIndex:", {
            from: pageIndex,
            to: updater.pageIndex,
          });
          setPageIndex(updater.pageIndex);
        } else if (updater.pageIndex === 0 && pageIndex !== 0) {
          console.log("Preventing automatic reset to page 0");
          // Don't update - prevent automatic reset to page 0
        }

        if (updater.pageSize !== pageSize) {
          setPageSize(updater.pageSize);
        }
      }
    },
    manualPagination: false,
    manualSorting: true,
  });

  return { table };
};
