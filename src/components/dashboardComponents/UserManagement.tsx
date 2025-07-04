"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, Pencil, Trash, KeyRound } from "lucide-react";
import {
  UserFormModal,
  UserFormData,
} from "@/components/dashboardComponents/UserFormModal";
import { PasswordResetModal } from "@/components/dashboardComponents/PasswordRestModal";
import { useToast } from "@/components/ui/use-toast";

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

interface ApiError {
  message: string;
  status?: number;
}

interface UsersManagementProps {
  onUserDeleted?: (userId: string) => void;
  onUserCreated?: (user: User) => void;
  onUserUpdated?: (user: User) => void;
  showCreateButton?: boolean;
  showActions?: boolean;
  filterActiveOnly?: boolean;
}

export default function UsersManagement({
  onUserDeleted,
  onUserCreated,
  onUserUpdated,
  showCreateButton = true,
  showActions = true,
  filterActiveOnly = true,
}: UsersManagementProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserForPassword, setSelectedUserForPassword] =
    useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
      toast({
        title: "Unauthorized",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
    }
  }, [status, session, router, toast]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users", {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      fetchUsers();
    }
  }, [fetchUsers, session]);

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
    if (!session?.user?.id) {
      toast({
        title: "Authentication Error",
        description: "User session not found. Please log in again.",
        variant: "destructive",
      });
      return;
    }
    try {
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

      const errorData = await response.json();

      if (!response.ok) {
        let errorMessage = "Something went wrong while creating the user.";
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

      await fetchUsers();
      setShowModal(false);
      toast({
        title: "Success!",
        description: "User account has been created successfully.",
        variant: "success",
      });

      // Call callback if provided
      if (onUserCreated) {
        const newUser = await response.json();
        onUserCreated(newUser);
      }
    } catch (error: unknown) {
      let userFriendlyMessage =
        "Failed to create user account. Please try again.";

      if (error instanceof Error) {
        userFriendlyMessage = error.message;
      }

      toast({
        title: "Couldn't create user",
        description: userFriendlyMessage,
        variant: "destructive",
      });
      throw new Error(userFriendlyMessage);
    }
  };

  const handleResetPassword = async (userId: string) => {
    const user = users.find((u: User) => u.id === userId);
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
        description: `Password has been reset for ${selectedUserForPassword.email}`,
        variant: "success",
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

      await fetchUsers();
      setShowModal(false);
      toast({
        title: "Success",
        description: "User updated successfully",
        variant: "success",
      });

      // Call callback if provided
      if (onUserUpdated) {
        const updatedUser = await response.json();
        onUserUpdated(updatedUser);
      }
    } catch (error) {
      const apiError = error as ApiError;
      console.error("Error updating user:", apiError);
      toast({
        title: "Error",
        description: apiError.message || "Failed to update user",
        variant: "destructive",
      });
      throw new Error(apiError.message || "Failed to update user");
    }
  };

  // In the handleDeleteUser function in UsersManagement.tsx
  const handleDeleteUser = async (userId: string) => {
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

      await fetchUsers();
      toast({
        title: "Success",
        description: `User permanently deleted successfully`,
        variant: "success",
      });

      if (onUserDeleted) {
        onUserDeleted(userId);
      }
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

  const filteredUsers = filterActiveOnly
    ? users.filter((user) => user.status === "ACTIVE")
    : users;

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen bg-background dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 dark:border-white border-t-transparent"></div>
      </div>
    );
  }

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="space-y-6 p-6 bg-background dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            User Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create and manage user accounts for your organization
          </p>
        </div>
        {showCreateButton && (
          <Button
            onClick={() => {
              setSelectedUser(null);
              setShowModal(true);
            }}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create User
          </Button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200 dark:border-gray-700">
              <TableHead className="text-gray-700 dark:text-gray-300">
                Name
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">
                Email
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">
                Role
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">
                Status
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">
                Created
              </TableHead>
              <TableHead className="text-gray-700 dark:text-gray-300">
                Last Login
              </TableHead>
              {showActions && (
                <TableHead className="text-gray-700 dark:text-gray-300">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={showActions ? 7 : 6}
                  className="text-center py-8 text-gray-500 dark:text-gray-400"
                >
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 dark:border-gray-600 border-t-transparent"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={showActions ? 7 : 6}
                  className="text-center py-8 text-gray-500 dark:text-gray-400"
                >
                  {filterActiveOnly
                    ? "No active users found. Create your first user to get started."
                    : "No users found."}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <TableCell className="text-gray-900 dark:text-gray-100">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-100">
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "ADMIN" ? "default" : "outline"}
                      className="dark:border-gray-600"
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.status === "ACTIVE" ? "success" : "secondary"
                      }
                      className="dark:border-gray-600"
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-100">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-gray-900 dark:text-gray-100">
                    {formatDate(user.lastLogin)}
                  </TableCell>
                  {showActions && (
                    <TableCell className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowModal(true);
                        }}
                        className="hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResetPassword(user.id)}
                        className="hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
                      >
                        <KeyRound className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:border-gray-600"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <UserFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedUser(null);
        }}
        onSubmit={selectedUser ? handleUpdateUser : handleCreateUser}
        initialData={
          selectedUser
            ? {
                firstName: selectedUser.firstName,
                lastName: selectedUser.lastName,
                email: selectedUser.email,
                phoneNumber: selectedUser.phoneNumber,
                country: selectedUser.country,
                role: selectedUser.role,
                status: selectedUser.status,
                permissions: selectedUser.permissions,
              }
            : undefined
        }
        mode={selectedUser ? "edit" : "create"}
      />

      <PasswordResetModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setSelectedUserForPassword(null);
        }}
        onSubmit={handlePasswordReset}
        userEmail={selectedUserForPassword?.email || ""}
      />
    </div>
  );
}
