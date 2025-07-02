// src/components/dashboardComponents/BulkActions.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Lead } from "@/types/leads";

interface BulkActionsProps {
  selectedLeads: Lead[];
  hasAssignedLeads: boolean;
  assignedLeadsCount: number;
  isUpdating: boolean;
  onAssign: () => void;
  onUnassign: () => void;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedLeads,
  hasAssignedLeads,
  assignedLeadsCount,
  isUpdating,
  onAssign,
  onUnassign,
}) => {
  if (selectedLeads.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2">
      <Button variant="default" onClick={onAssign} disabled={isUpdating}>
        Assign {selectedLeads.length} Lead
        {selectedLeads.length > 1 ? "s" : ""}
      </Button>
      {hasAssignedLeads && (
        <Button
          variant="destructive"
          onClick={onUnassign}
          disabled={isUpdating}
        >
          Unassign {assignedLeadsCount} Lead
          {assignedLeadsCount > 1 ? "s" : ""}
        </Button>
      )}
    </div>
  );
};

export default BulkActions;
