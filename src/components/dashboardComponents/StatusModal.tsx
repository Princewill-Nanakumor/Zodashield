// src/components/dashboardComponents/StatusModal.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Trash2, Pencil } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Status } from "@/types/leads";

interface StatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusCreated?: () => void;
}

const StatusModal = ({
  isOpen,
  onClose,
  onStatusCreated,
}: StatusModalProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    color: "#000000",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if modal should be open on page load
  useEffect(() => {
    const shouldOpenModal = localStorage.getItem("statusModalOpen");
    if (shouldOpenModal === "true" && !isOpen) {
      // Trigger the modal to open by dispatching a custom event
      const event = new CustomEvent("openStatusModal");
      window.dispatchEvent(event);
    }
  }, [isOpen]);

  const fetchStatuses = useCallback(async () => {
    try {
      const response = await fetch("/api/statuses");
      if (!response.ok) {
        throw new Error("Failed to fetch statuses");
      }
      const data = await response.json();
      setStatuses(data);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load statuses 2";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Error fetching statuses:", error);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsCreating(true);
      const url = isEditing ? `/api/statuses/${editingId}` : "/api/statuses";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Failed to ${isEditing ? "update" : "create"} status`
        );
      }

      // Parse the response but don't store it since we're invalidating cache
      await response.json();

      toast({
        title: "Success",
        description: `Status ${isEditing ? "updated" : "created"} successfully`,
        variant: "success",
      });

      // Invalidate the statuses cache so StatusContext gets updated
      await queryClient.invalidateQueries({
        queryKey: ["statuses"],
        exact: false,
      });

      // Also invalidate the leads cache to refresh the table
      await queryClient.invalidateQueries({
        queryKey: ["leads"],
        exact: false,
      });

      if (isEditing && editingId) {
        setStatuses((prev) =>
          prev.map((status) =>
            status._id === editingId ? { ...status, ...formData } : status
          )
        );
      } else {
        await fetchStatuses();
      }

      resetForm();
      onStatusCreated?.();

      // Set flag to keep modal open after refresh
      localStorage.setItem("statusModalOpen", "true");

      // Add delay before page refresh so user can see the success message
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : `Failed to ${isEditing ? "update" : "create"} status`;
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      console.error(
        `Error ${isEditing ? "updating" : "creating"} status:`,
        error
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (status: Status) => {
    setFormData({
      name: status.name,
      color: status.color || "#000000",
    });
    setEditingId(status.id || status._id || "");
    setIsEditing(true);
  };

  const handleDelete = async (statusId: string) => {
    if (window.confirm("Are you sure you want to delete this status?")) {
      try {
        const response = await fetch(`/api/statuses/${statusId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete status");
        }

        toast({
          title: "Success",
          description: "Status deleted successfully",
          variant: "success",
        });

        // Invalidate the statuses cache
        await queryClient.invalidateQueries({
          queryKey: ["statuses"],
          exact: false,
        });

        // Also invalidate the leads cache
        await queryClient.invalidateQueries({
          queryKey: ["leads"],
          exact: false,
        });

        setStatuses((prev) => prev.filter((status) => status._id !== statusId));

        // Set flag to keep modal open after refresh
        localStorage.setItem("statusModalOpen", "true");

        // Add delay before page refresh so user can see the success message
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err: unknown) {
        console.error("Error deleting status:", err);
        toast({
          title: "Error",
          description:
            err instanceof Error ? err.message : "Failed to delete status",
          variant: "destructive",
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: "", color: "#000000" });
    setIsEditing(false);
    setEditingId(null);
  };

  // Clear the localStorage flag when modal is closed
  const handleClose = () => {
    localStorage.removeItem("statusModalOpen");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">
            {isEditing ? "Edit Status" : "Create New Status"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-6">
          {/* Create/Edit Status Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Status Name
              </label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter status name"
                required
                className="mt-1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Color
              </label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                  required
                  className="w-20 mt-1 p-1"
                />
                <div className="flex-1 p-2 rounded border border-gray-200 dark:border-gray-700">
                  <div
                    className="w-full h-full rounded"
                    style={{ backgroundColor: formData.color }}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              {isEditing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="mr-2"
                >
                  Cancel Edit
                </Button>
              )}
              <Button type="button" variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button
                type="submit"
                disabled={isCreating}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : isEditing ? (
                  "Update Status"
                ) : (
                  "Create Status"
                )}
              </Button>
            </DialogFooter>
          </form>
          {/* Existing Statuses */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                Existing Statuses
              </h3>
              <span className="text-xs  text-black dark:text-gray-400 font-medium  bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                {statuses.length}{" "}
                {statuses.length === 1 ? "status" : "statuses"}
              </span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-500 dark:text-gray-400" />
              </div>
            ) : (
              <div
                className={`grid gap-2 ${
                  statuses.length > 5 ? "max-h-64 overflow-y-auto pr-2" : ""
                }`}
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: "#9CA3AF #F3F4F6",
                }}
              >
                {statuses.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                    No statuses found. Create your first status above.
                  </div>
                ) : (
                  statuses.map((status) => (
                    <div
                      key={status._id}
                      className="flex items-center justify-between p-2 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: status.color }}
                        />
                        <span className="text-gray-800 dark:text-gray-200">
                          {status.name}
                        </span>
                        <code className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-sm text-gray-600 dark:text-gray-300">
                          {status.color}
                        </code>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(status)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDelete(status.id || status._id || "")
                          }
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StatusModal;
