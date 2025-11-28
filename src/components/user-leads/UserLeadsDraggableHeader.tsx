// src/components/user-leads/UserLeadsDraggableHeader.tsx
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TableHead } from "@/components/ui/Table";
import { Button } from "@/components/ui/button";
import { GripVertical, ArrowUpDown } from "lucide-react";
import { UserLeadsColumnId } from "@/hooks/useUserLeadsColumnOrder";

interface UserLeadsDraggableHeaderProps {
  columnId: UserLeadsColumnId;
  children: React.ReactNode;
  isSortable?: boolean;
  isSorted?: boolean;
  sortOrder?: "asc" | "desc";
  onSort?: () => void;
}

export function UserLeadsDraggableHeader({
  columnId,
  children,
  isSortable = false,
  isSorted = false,
  sortOrder,
  onSort,
}: UserLeadsDraggableHeaderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: columnId,
    disabled: columnId === "actions", // Don't allow dragging the actions column
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Actions column is not draggable
  if (columnId === "actions") {
    return (
      <TableHead className="text-center text-gray-900 dark:text-white">
        {children}
      </TableHead>
    );
  }

  const headerContent = isSortable ? (
    <Button
      variant="ghost"
      onClick={onSort}
      className="h-8 flex items-center gap-1 text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-200"
    >
      {children}
      <ArrowUpDown
        className={`h-4 w-4 ${
          isSorted
            ? sortOrder === "asc"
              ? "rotate-180"
              : ""
            : "text-muted-foreground"
        }`}
      />
    </Button>
  ) : (
    <span>{children}</span>
  );

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={`text-gray-900 dark:text-white ${
        columnId === "lastComment" ? "max-w-[200px]" : ""
      }`}
    >
      <div className="flex items-center gap-2 group">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          aria-label="Drag to reorder column"
        >
          <GripVertical className="w-4 h-4 text-gray-400" />
        </button>
        <div className="flex-1">{headerContent}</div>
      </div>
    </TableHead>
  );
}

