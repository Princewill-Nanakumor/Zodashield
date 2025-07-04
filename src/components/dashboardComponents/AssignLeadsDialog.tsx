// src/app/components/dashboardComponents/AssignLeadsDialog.tsx
"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
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

  const handleClose = () => {
    setSelectedUser(""); // Reset when closing
    onClose();
  };

  const handleAssignClick = () => {
    // If no user is selected, this means we want to unassign
    if (!selectedUser) {
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

  // Don't render anything if not open
  if (!isOpen) return null;

  return (
    <>
      {/* Main Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {selectedLeads.length > 1
                ? "Assign Multiple Leads"
                : firstSelectedLead?.assignedTo
                  ? "Reassign Lead"
                  : "Assign Lead"}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {firstSelectedLead?.assignedTo && selectedLeads.length === 1 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Currently assigned to
                </label>
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-md text-sm text-gray-700 dark:text-gray-300">
                  {typeof firstSelectedLead.assignedTo === "string"
                    ? firstSelectedLead.assignedTo
                    : `${firstSelectedLead.assignedTo.firstName} ${firstSelectedLead.assignedTo.lastName}`}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedLeads.some((l) => l.assignedTo)
                  ? "Select new assignee"
                  : "Select User"}
              </label>
              {isLoadingUsers ? (
                <div className="flex items-center justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500 dark:text-gray-400" />
                </div>
              ) : (
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a user</option>
                  {users && users.length > 0 ? (
                    users.map((user) => {
                      const isCurrentAssignee = selectedLeads.some(
                        (l) => l.assignedTo?.id === user.id
                      );
                      return (
                        <option
                          key={user.id}
                          value={user.id}
                          disabled={isCurrentAssignee}
                        >
                          {user.firstName} {user.lastName}
                          {isCurrentAssignee && " (Current)"}
                        </option>
                      );
                    })
                  ) : (
                    <option value="no-users" disabled>
                      No users available
                    </option>
                  )}
                </select>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleAssignClick}
                disabled={isAssigning || !selectedUser}
              >
                {isAssigning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : selectedLeads.some((l) => l.assignedTo) ? (
                  "Reassign"
                ) : (
                  "Assign"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsConfirmOpen(false)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Are you sure you want to reassign?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              One or more of these leads are already assigned. Reassigning will
              change the owner.
            </p>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmAssign}>Yes, Reassign</Button>
            </div>
          </div>
        </div>
      )}

      {/* Unassign Dialog */}
      {isUnassignDialogOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsUnassignDialogOpen(false)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Are you sure you want to unassign?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Unassigning will remove the owner from these leads.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsUnassignDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleUnassignConfirm}>Yes, Unassign</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
