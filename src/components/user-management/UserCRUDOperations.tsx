// src/components/user-management/UserCRUDOperations.tsx
"use client";

import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  country: string;
  role: string;
  status: string;
  permissions: string[];
  createdBy: string;
  createdAt: string;
  lastLogin?: string;
}

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  country: string;
  role: string;
  status: string;
  permissions: string[];
}

interface UserCRUDOperationsProps {
  onUserCreated?: (user: User) => void;
  onUserUpdated?: (user: User) => void;
  onUserDeleted?: (userId: string) => void;
  onRefreshUsers: () => void;
  children: (operations: {
    handleCreateUser: (userData: UserFormData) => Promise<void>;
    handleUpdateUser: (userData: UserFormData, userId: string) => Promise<void>;
    handleDeleteUser: (userId: string) => Promise<void>;
    handleResetPassword: (userId: string, password: string) => Promise<void>;
  }) => React.ReactNode;
}

export function UserCRUDOperations({
  onUserCreated,
  onUserUpdated,
  onUserDeleted,
  onRefreshUsers,
  children,
}: UserCRUDOperationsProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleCreateUser = useCallback(
    async (userData: UserFormData) => {
      if (!session?.user?.id) {
        throw new Error("User session not found. Please log in again.");
      }

      console.log("Making API call to create user...");
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          ...userData,
          createdBy: session.user.id,
          status: "ACTIVE",
        }),
      });

      const data = await response.json();
      console.log("API response:", response.status, data);

      if (!response.ok) {
        let errorMessage = "Something went wrong while creating the user.";

        if (response.status === 409) {
          errorMessage =
            data.message || "This email address is already in use.";
        } else if (response.status === 400) {
          errorMessage = data.message || "Invalid user data.";
        } else if (response.status === 401) {
          errorMessage = "You are not authorized to create users.";
        } else {
          errorMessage = data.message || errorMessage;
        }

        throw new Error(errorMessage);
      }

      // Only show success toast here
      toast({
        title: "Success",
        description: "User created successfully",
      });

      await queryClient.invalidateQueries({ queryKey: ["users"] });
      await onRefreshUsers();
      onUserCreated?.(data.user);
    },
    [session?.user?.id, queryClient, onRefreshUsers, onUserCreated, toast]
  );

  const handleUpdateUser = useCallback(
    async (userData: UserFormData, userId: string) => {
      try {
        const response = await fetch(`/api/users`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            id: userId,
            ...userData,
          }),
        });

        const errorData = await response.json();

        if (!response.ok) {
          let errorMessage = "Failed to update user.";
          if (response.status === 409) {
            errorMessage =
              errorData.message ||
              "This email address is already in use. Please use a different email.";
          } else if (response.status === 400) {
            errorMessage =
              errorData.message ||
              "Invalid user data. Please check your inputs and try again.";
          } else {
            errorMessage = errorData.message || errorMessage;
          }
          throw new Error(errorMessage);
        }

        // Invalidate and refetch users query
        await queryClient.invalidateQueries({ queryKey: ["users"] });

        onRefreshUsers();
        toast({
          title: "Success",
          description: "User updated successfully",
          variant: "success",
        });

        if (onUserUpdated) {
          const updatedUser = await response.json();
          onUserUpdated(updatedUser);
        }
      } catch (error) {
        console.error("Error updating user:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to update user",
          variant: "destructive",
        });
        throw error;
      }
    },
    [toast, queryClient, onRefreshUsers, onUserUpdated]
  );

  const handleDeleteUser = useCallback(
    async (userId: string) => {
      if (
        !confirm(
          "Are you sure you want to PERMANENTLY delete this user? This action cannot be undone and will unassign all leads from this user."
        )
      )
        return;

      try {
        const response = await fetch(`/api/users?id=${userId}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to delete user");
        }

        // Invalidate and refetch users query
        await queryClient.invalidateQueries({ queryKey: ["users"] });

        onRefreshUsers();
        toast({
          title: "Success",
          description: `User permanently deleted successfully`,
          variant: "success",
        });

        if (onUserDeleted) {
          onUserDeleted(userId);
        }
      } catch (error) {
        console.error("Error deleting user:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to delete user",
          variant: "destructive",
        });
      }
    },
    [toast, queryClient, onRefreshUsers, onUserDeleted]
  );

  const handleResetPassword = useCallback(
    async (userId: string, password: string) => {
      try {
        const response = await fetch(`/api/users/${userId}/reset-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ password }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to reset password");
        }

        toast({
          title: "Success",
          description: `Password has been reset successfully`,
          variant: "success",
        });
      } catch (error) {
        console.error("Error resetting password:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to reset password",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  return (
    <>
      {children({
        handleCreateUser,
        handleUpdateUser,
        handleDeleteUser,
        handleResetPassword,
      })}
    </>
  );
}
