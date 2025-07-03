// src/components/dashboardComponents/TableConfiguration.tsx
"use client";

import {
  useReactTable,
  getPaginationRowModel,
  getCoreRowModel,
  getSortedRowModel,
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
  setSorting: (sorting: Array<{ id: string; desc: boolean }>) => void;
  setPageIndex: (pageIndex: number) => void;
  setPageSize: (pageSize: number) => void;
}

export const useTableConfiguration = ({
  data,
  columns,
  pageSize,
  pageIndex,
  sorting,
  rowSelection,
  setSorting,
  setPageIndex,
  setPageSize,
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

  return { table };
};
