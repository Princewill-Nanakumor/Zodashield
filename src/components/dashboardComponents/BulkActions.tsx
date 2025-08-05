// src/components/dashboardComponents/BulkActions.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Lead } from "@/types/leads";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface BulkActionsProps {
  selectedLeads: Lead[];
  hasAssignedLeads: boolean;
  assignedLeadsCount: number;
  isUpdating: boolean;
  onAssign: () => void;
  onUnassign: () => void;
}

// Update your BulkActions component to show immediate feedback
export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedLeads,
  hasAssignedLeads,
  assignedLeadsCount,
  isUpdating,
  onAssign,
  onUnassign,
}) => {
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUnassigning, setIsUnassigning] = useState(false);

  const handleAssign = async () => {
    setIsAssigning(true);
    try {
      await onAssign();
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassign = async () => {
    setIsUnassigning(true);
    try {
      await onUnassign();
    } finally {
      setIsUnassigning(false);
    }
  };

  if (selectedLeads.length === 0) return null;

  return (
    <div className="flex gap-2">
      <Button
        variant="default"
        onClick={handleAssign}
        disabled={isUpdating || isAssigning}
      >
        {isAssigning ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Assigning...
          </>
        ) : (
          `Assign ${selectedLeads.length} Lead${selectedLeads.length > 1 ? "s" : ""}`
        )}
      </Button>
      {hasAssignedLeads && (
        <Button
          variant="destructive"
          onClick={handleUnassign}
          disabled={isUpdating || isUnassigning}
        >
          {isUnassigning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Unassigning...
            </>
          ) : (
            `Unassign ${assignedLeadsCount} Lead${assignedLeadsCount > 1 ? "s" : ""}`
          )}
        </Button>
      )}
    </div>
  );
};
export default BulkActions;
