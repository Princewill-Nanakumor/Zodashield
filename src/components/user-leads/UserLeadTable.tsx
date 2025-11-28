// src/components/user-leads/UserLeadTable.tsx
"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/Table";
import { Loader2 } from "lucide-react";
import { Lead } from "@/types/leads";
import { useStatuses } from "@/hooks/useStatuses";
import { useUserLeadsColumnOrder } from "@/hooks/useUserLeadsColumnOrder";
import { UserLeadsDraggableHeader } from "./UserLeadsDraggableHeader";
import { renderUserLeadCell } from "./UserLeadsColumnRenderer";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSearchParams } from "next/navigation";

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

function LoadingRow({ columnCount }: { columnCount: number }) {
  return (
    <TableRow>
      <TableCell colSpan={columnCount} className="h-24 text-center">
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading leads...
        </div>
      </TableCell>
    </TableRow>
  );
}

function EmptyRow({ columnCount }: { columnCount: number }) {
  return (
    <TableRow>
      <TableCell
        colSpan={columnCount}
        className="h-24 text-center text-gray-500 dark:text-gray-400"
      >
        No leads found
      </TableCell>
    </TableRow>
  );
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
  const { statuses, isLoading: statusesLoading } = useStatuses();
  const { columnOrder, setColumnOrder } = useUserLeadsColumnOrder();
  const searchParams = useSearchParams();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = columnOrder.findIndex((id) => id === active.id);
      const newIndex = columnOrder.findIndex((id) => id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newColumnOrder = arrayMove(columnOrder, oldIndex, newIndex);
        setColumnOrder(newColumnOrder);
      }
    }
  };

  const columnConfig: Record<
    string,
    { label: string; isSortable: boolean; sortField?: SortField }
  > = {
    actions: { label: "Actions", isSortable: false },
    name: { label: "Name", isSortable: true, sortField: "name" },
    email: { label: "Email", isSortable: false },
    phone: { label: "Phone", isSortable: false },
    country: { label: "Country", isSortable: true, sortField: "country" },
    status: { label: "Status", isSortable: true, sortField: "status" },
    source: { label: "Source", isSortable: true, sortField: "source" },
    assignedTo: { label: "Assigned To", isSortable: false },
    lastComment: { label: "Last Comment", isSortable: false },
    lastCommentDate: { label: "Last Comment Date", isSortable: false },
    commentCount: { label: "Comments", isSortable: false },
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <Table>
        <TableHeader className="bg-gray-100 dark:bg-gray-700">
          <TableRow>
            <SortableContext
              items={columnOrder}
              strategy={horizontalListSortingStrategy}
            >
              {columnOrder.map((columnId) => {
                const config = columnConfig[columnId];
                if (!config) return null;

                const isSortable = !!config.isSortable && !!config.sortField;
                const isSorted = isSortable && sortField === config.sortField;

                return (
                  <UserLeadsDraggableHeader
                    key={columnId}
                    columnId={columnId}
                    isSortable={isSortable}
                    isSorted={isSorted}
                    sortOrder={sortOrder}
                    onSort={isSortable && config.sortField ? () => onSort(config.sortField!) : undefined}
                  >
                    {config.label}
                  </UserLeadsDraggableHeader>
                );
              })}
            </SortableContext>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <LoadingRow columnCount={columnOrder.length} />
          ) : paginatedLeads.length === 0 ? (
            <EmptyRow columnCount={columnOrder.length} />
          ) : (
            paginatedLeads.map((lead: Lead) => {
              const isSelected = selectedLead?._id === lead._id;
              const currentParams = searchParams.toString();
              const detailUrl = currentParams
                ? `/dashboard/leads/${lead._id}?${currentParams}`
                : `/dashboard/leads/${lead._id}`;
              
              return (
                <TableRow
                  key={`${lead._id}-${lead.status}`}
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
                  {columnOrder.map((columnId) =>
                    renderUserLeadCell({
                      columnId,
                      lead,
                      isSelected,
                      statuses,
                      statusesLoading,
                      detailUrl,
                    })
                  )}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </DndContext>
  );
}
