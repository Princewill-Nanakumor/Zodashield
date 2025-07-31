// src/components/adminManagement/AdminList.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "../ui/use-toast";
import { AdminCard } from "./AdminCard";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog";
import { AdminStats } from "@/types/adminManagement"; // Fix the import

interface AdminListProps {
  admins: AdminStats[];
  allowedEmails: string[];
  onAdminDeleted?: (adminId: string) => void;
}

export default function AdminList({
  admins,
  allowedEmails,
  onAdminDeleted,
}: AdminListProps) {
  const { toast } = useToast();
  const [deletingAdminId, setDeletingAdminId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<AdminStats | null>(null);

  const handleDeleteClick = (admin: AdminStats) => {
    setAdminToDelete(admin);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!adminToDelete) return;

    setDeletingAdminId(adminToDelete._id);
    setShowDeleteDialog(false);

    try {
      const response = await fetch(`/api/admin/delete-admin`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminId: adminToDelete._id,
          adminEmail: adminToDelete.email,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Admin Deleted",
          description: `Successfully deleted ${adminToDelete.firstName} ${adminToDelete.lastName} and all associated data.`,
          variant: "success",
        });

        // Call the callback to update the parent component
        onAdminDeleted?.(adminToDelete._id);
      } else {
        throw new Error(data.message || "Failed to delete admin");
      }
    } catch (error) {
      console.error("Error deleting admin:", error);
      toast({
        title: "Delete Failed",
        description:
          error instanceof Error ? error.message : "Failed to delete admin",
        variant: "destructive",
      });
    } finally {
      setDeletingAdminId(null);
      setAdminToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setAdminToDelete(null);
  };

  return (
    <>
      <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">
            All Administrators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {admins.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No administrators found
                </p>
              </div>
            ) : (
              admins.map((admin) => (
                <AdminCard
                  key={admin._id}
                  admin={admin}
                  allowedEmails={allowedEmails}
                  onDeleteClick={handleDeleteClick}
                  deletingAdminId={deletingAdminId}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        adminToDelete={adminToDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </>
  );
}
