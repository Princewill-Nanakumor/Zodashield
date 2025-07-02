// /Users/safeconnection/Downloads/drivecrm-main/src/components/dashboardComponents/AssignLeadsDialog.tsx

"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { User } from "@/types/user.types";
import { Lead } from "@/types/leads";

interface AssignLeadsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  selectedUser: string;
  setSelectedUser: (value: string) => void;
  isLoadingUsers: boolean;
  isAssigning: boolean;
  onAssign: () => Promise<void>;
  onUnassign?: () => Promise<void>;
  selectedLeads: Lead[];
}

export function AssignLeadsDialog({
  isOpen,
  onClose,
  users,
  selectedUser,
  setSelectedUser,
  isLoadingUsers,
  isAssigning,
  onAssign,
  onUnassign,
  selectedLeads,
}: AssignLeadsDialogProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isUnassignDialogOpen, setIsUnassignDialogOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedUser("");
    }
  }, [isOpen, setSelectedUser]);

  // Helper function to get assigned user ID
  const getAssignedUserId = (
    assignedTo:
      | string
      | { id: string; firstName: string; lastName: string }
      | null
      | undefined
  ) => {
    if (!assignedTo) return null;
    return typeof assignedTo === "string" ? assignedTo : assignedTo.id;
  };

  // Helper function to get assigned user name
  const getAssignedUserName = (
    assignedTo:
      | string
      | { id: string; firstName: string; lastName: string }
      | null
      | undefined
  ) => {
    if (!assignedTo) return "Unassigned";
    return typeof assignedTo === "string"
      ? assignedTo
      : `${assignedTo.firstName} ${assignedTo.lastName}`;
  };

  const handleAssignClick = () => {
    // If "unassign" is selected, trigger unassign
    if (selectedUser === "unassign") {
      if (onUnassign) {
        setIsUnassignDialogOpen(true);
      }
      return;
    }

    // If a user is selected, this is a normal assign/reassign
    const isReassigning = selectedLeads.some((l) => l.assignedTo);
    if (isReassigning) {
      setIsConfirmOpen(true);
    } else {
      onAssign();
    }
  };

  const handleConfirmAssign = () => {
    onAssign();
    setIsConfirmOpen(false);
  };

  const handleUnassignConfirm = () => {
    if (onUnassign) {
      onUnassign();
    }
    setIsUnassignDialogOpen(false);
  };

  const firstSelectedLead = selectedLeads?.[0];
  const hasAssignedLeads = selectedLeads.some((l) => l.assignedTo);
  const assignedLeadsCount = selectedLeads.filter((l) => l.assignedTo).length;

  // Check if assign button should be disabled
  const isAssignDisabled =
    isAssigning || !selectedUser || selectedUser === "unassign";

  // Button text logic
  const getButtonText = () => {
    if (isAssigning) {
      return "Processing...";
    }
    if (selectedUser === "unassign") {
      return "Unassign";
    }
    if (hasAssignedLeads) {
      return "Reassign";
    }
    return "Assign";
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedLeads.length > 1
                ? "Manage Lead Assignments"
                : firstSelectedLead?.assignedTo
                  ? "Reassign Lead"
                  : "Assign Lead"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {firstSelectedLead?.assignedTo && selectedLeads.length === 1 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Currently assigned to
                </label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-700 dark:text-gray-300">
                  {getAssignedUserName(firstSelectedLead.assignedTo)}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {hasAssignedLeads
                  ? "Select new assignee or unassign"
                  : "Select User"}
              </label>
              {isLoadingUsers ? (
                <div className="flex items-center justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500 dark:text-gray-400" />
                </div>
              ) : (
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user or unassign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassign">Unassign</SelectItem>
                    {users && users.length > 0 ? (
                      users.map((user) => {
                        const isCurrentAssignee = selectedLeads.some(
                          (l) => getAssignedUserId(l.assignedTo) === user.id
                        );
                        return (
                          <SelectItem
                            key={user.id}
                            value={user.id}
                            disabled={isCurrentAssignee}
                          >
                            {user.firstName} {user.lastName}
                            {isCurrentAssignee && " (Current)"}
                          </SelectItem>
                        );
                      })
                    ) : (
                      <SelectItem value="no-users" disabled>
                        No users available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleAssignClick} disabled={isAssignDisabled}>
                {isAssigning && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {getButtonText()}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to reassign?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {assignedLeadsCount} of {selectedLeads.length} selected lead
              {selectedLeads.length > 1 ? "s" : ""}
              {assignedLeadsCount > 1 ? " are" : " is"} already assigned.
              Reassigning will change the owner.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAssign}>
              Yes, Reassign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={isUnassignDialogOpen}
        onOpenChange={setIsUnassignDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to unassign {assignedLeadsCount} lead
              {assignedLeadsCount > 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the assignment from the selected leads. They will
              become unassigned and available for reassignment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnassignConfirm}>
              Yes, Unassign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
