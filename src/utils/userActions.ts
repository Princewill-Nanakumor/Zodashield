// src/utils/userActions.ts
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { User, UserFormData, ApiError } from "@/types/user.types";

export function useUserActions(
  fetchUsers: () => Promise<void>,
  setShowModal: (show: boolean) => void,
  selectedUser: User | null,
  users: User[]
) {
  const { toast } = useToast();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] =
    useState<User | null>(null);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleCreateUser = async (userData: UserFormData) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create user");
      }

      await fetchUsers();
      toast({
        title: "Success",
        description: "User created successfully",
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create user";
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleResetPassword = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setSelectedUserForPassword(user);
      setShowPasswordModal(true);
    }
  };

  const handlePasswordReset = async (password: string) => {
    if (!selectedUserForPassword) return;

    try {
      const response = await fetch(
        `/api/users/${selectedUserForPassword.id}/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ password }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to reset password");
      }

      toast({
        title: "Success",
        description: "Password has been reset successfully",
      });
      setShowPasswordModal(false);
      setSelectedUserForPassword(null);
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Error resetting password:", apiError);
      toast({
        title: "Error",
        description: apiError.message || "Failed to reset password",
        variant: "destructive",
      });
    }
  };

  const handleUpdateUser = async (userData: UserFormData) => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/users`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          id: selectedUser.id,
          ...userData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update user");
      }

      await fetchUsers();
      setShowModal(false);
      toast({
        title: "Success",
        description: "User updated successfully",
      });
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Error updating user:", apiError);
      toast({
        title: "Error",
        description: apiError.message || "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete user");
      }

      await fetchUsers();
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Error deleting user:", apiError);
      toast({
        title: "Error",
        description: apiError.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  return {
    formatDate,
    handleCreateUser,
    handleResetPassword,
    handleUpdateUser,
    handleDeleteUser,
    showPasswordModal,
    setShowPasswordModal,
    selectedUserForPassword,
    setSelectedUserForPassword,
    handlePasswordReset,
  };
}
