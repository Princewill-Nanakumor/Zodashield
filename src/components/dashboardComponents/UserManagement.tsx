"use client";

import { useSession } from "next-auth/react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { UserFormModal } from "@/components/dashboardComponents/UserFormModal";
import { PasswordResetModal } from "@/components/dashboardComponents/PasswordRestModal";
import { UserDataManager } from "../user-management/UserDataManager";
import { UserCRUDOperations } from "@/components/user-management/UserCRUDOperations";
import { UserTableDisplay } from "@/components/user-management/UserTableDisplay";
import { AuthGuard } from "@/components/user-management/AuthGuard";

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
  const { status } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserForPassword, setSelectedUserForPassword] =
    useState<User | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Create a callback to trigger data refresh
  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Handle successful user creation
  const handleUserCreated = useCallback(
    (user: User) => {
      // Call the parent callback if provided
      if (onUserCreated) {
        onUserCreated(user);
      }

      // Trigger data refresh
      triggerRefresh();

      // Close the modal
      setShowModal(false);
      setSelectedUser(null);
    },
    [onUserCreated, triggerRefresh]
  );

  // Handle successful user update
  const handleUserUpdated = useCallback(
    (user: User) => {
      // Call the parent callback if provided
      if (onUserUpdated) {
        onUserUpdated(user);
      }

      // Trigger data refresh
      triggerRefresh();

      // Close the modal
      setShowModal(false);
      setSelectedUser(null);
    },
    [onUserUpdated, triggerRefresh]
  );

  // Handle successful user deletion
  const handleUserDeleted = useCallback(
    (userId: string) => {
      // Call the parent callback if provided
      if (onUserDeleted) {
        onUserDeleted(userId);
      }

      // Trigger data refresh
      triggerRefresh();
    },
    [onUserDeleted, triggerRefresh]
  );

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen bg-background dark:bg-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 dark:border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <UserDataManager
        onUsersLoaded={setUsers}
        onLoadingChange={setLoading}
        refreshTrigger={refreshTrigger}
      >
        <UserCRUDOperations
          onUserCreated={handleUserCreated}
          onUserUpdated={handleUserUpdated}
          onUserDeleted={handleUserDeleted}
          onRefreshUsers={triggerRefresh}
        >
          {({
            handleCreateUser,
            handleUpdateUser,
            handleDeleteUser,
            handleResetPassword,
          }) => (
            <div className="space-y-6 p-6 bg-background dark:bg-gray-800 rounded border">
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

              <UserTableDisplay
                users={users}
                loading={loading}
                filterActiveOnly={filterActiveOnly}
                showActions={showActions}
                onEditUser={(user) => {
                  setSelectedUser(user);
                  setShowModal(true);
                }}
                onDeleteUser={handleDeleteUser}
                onResetPassword={(userId) => {
                  const user = users.find((u) => u.id === userId);
                  if (user) {
                    setSelectedUserForPassword(user);
                    setShowPasswordModal(true);
                  }
                }}
              />

              <UserFormModal
                isOpen={showModal}
                onClose={() => {
                  setShowModal(false);
                  setSelectedUser(null);
                }}
                onSubmit={async (userData) => {
                  try {
                    if (selectedUser) {
                      // Update existing user
                      const updatedUser = await handleUpdateUser(
                        userData,
                        selectedUser.id
                      );
                      handleUserUpdated(updatedUser);
                    } else {
                      // Create new user
                      const newUser = await handleCreateUser(userData);
                      handleUserCreated(newUser);
                    }
                  } catch (error) {
                    // Error handling is done in the modal component
                    console.error("Error in form submission:", error);
                  }
                }}
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
                onSubmit={async (password) => {
                  if (selectedUserForPassword) {
                    await handleResetPassword(
                      selectedUserForPassword.id,
                      password
                    );
                    setShowPasswordModal(false);
                    setSelectedUserForPassword(null);
                  }
                }}
                userEmail={selectedUserForPassword?.email || ""}
              />
            </div>
          )}
        </UserCRUDOperations>
      </UserDataManager>
    </AuthGuard>
  );
}
