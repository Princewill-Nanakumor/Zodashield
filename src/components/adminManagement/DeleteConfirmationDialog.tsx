// src/components/adminManagement/DeleteConfirmationDialog.tsx
"use client";

import { AlertTriangle } from "lucide-react";
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
import { AdminStats } from "@/types/adminManagement"; // Fix the import

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  adminToDelete: AdminStats | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmationDialog({
  isOpen,
  onOpenChange,
  adminToDelete,
  onConfirm,
  onCancel,
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span>Delete Administrator</span>
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div>
              <p>
                Are you sure you want to delete{" "}
                <strong>
                  {adminToDelete?.firstName} {adminToDelete?.lastName}
                </strong>
                ? This action will permanently delete:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>The administrator account</li>
                <li>
                  All associated agent accounts ({adminToDelete?.agentCount}{" "}
                  agents)
                </li>
                <li>All leads ({adminToDelete?.leadCount} leads)</li>
                <li>All uploaded files and data</li>
                <li>All activity logs and history</li>
              </ul>
              <p className="mt-3 font-semibold text-red-600">
                This action cannot be undone.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete Administrator
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
