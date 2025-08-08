// src/components/user-management/UserManagement.tsx
"use client";
import { useSession } from "next-auth/react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon, Shield } from "lucide-react";
import { UserFormModal } from "./UserFormModal";
import { PasswordResetModal } from "../dashboardComponents/PasswordRestModal";
import { UserCRUDOperations } from "@/components/user-management/UserCRUDOperations";
import { UserTableDisplay } from "@/components/user-management/UserTableDisplay";
import { AuthGuard } from "@/components/user-management/AuthGuard";
import UsageLimitsDisplay from "./UsageLimitsDisplay";
import { useUserUsageData } from "@/hooks/useUserUsageData";
import { useUsersData } from "@/hooks/useUsersData";

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
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserForPassword, setSelectedUserForPassword] =
    useState<User | null>(null);
  const [showUsageLimit, setShowUsageLimit] = useState(false);

  // Use React Query for user data
  const {
    data: users = [],
    isLoading: usersLoading,
    refetch: refetchUsers,
  } = useUsersData();

  // Use React Query for user usage data
  const {
    userUsageData,
    isLoading: usageDataLoading,
    refreshUserUsageData,
  } = useUserUsageData();

  const handleUserCreated = useCallback(
    (user: User) => {
      onUserCreated?.(user);
      refetchUsers(); // Refetch users after creation
      refreshUserUsageData(); // Refetch usage immediately
      setShowModal(false);
      setSelectedUser(null);
    },
    [onUserCreated, refetchUsers, refreshUserUsageData]
  );

  const handleUserUpdated = useCallback(
    (user: User) => {
      onUserUpdated?.(user);
      refetchUsers(); // Refetch users after update
      refreshUserUsageData(); // Keep usage in sync if role/status changes matter
      setShowModal(false);
      setSelectedUser(null);
    },
    [onUserUpdated, refetchUsers, refreshUserUsageData]
  );

  const handleUserDeleted = useCallback(
    (userId: string) => {
      onUserDeleted?.(userId);
      refetchUsers(); // Refetch users after deletion
      refreshUserUsageData(); // Refetch usage immediately
    },
    [onUserDeleted, refetchUsers, refreshUserUsageData]
  );

  const handleCreateUserClick = useCallback(() => {
    if (userUsageData && !userUsageData.canAddTeamMember) {
      setShowUsageLimit(true);
      return;
    }
    setSelectedUser(null);
    setShowModal(true);
  }, [userUsageData]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-transparent border-t-blue-400 border-r-purple-500 rounded-full animate-spin w-16 h-16"></div>
          <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600">
            <Shield size={28} className="text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <UserCRUDOperations
        onUserCreated={handleUserCreated}
        onUserUpdated={handleUserUpdated}
        onUserDeleted={handleUserDeleted}
        onRefreshUsers={refetchUsers}
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
                <div className="flex items-center gap-2">
                  {usageDataLoading ? (
                    // Loading skeleton for the button
                    <div className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse">
                      <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                      <div className="w-20 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                    </div>
                  ) : (
                    <Button
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 !text-white"
                      onClick={handleCreateUserClick}
                      disabled={
                        !!(userUsageData && !userUsageData.canAddTeamMember)
                      }
                    >
                      <PlusIcon className="h-4 w-4" />
                      Create User
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Usage Limits Display - Now uses React Query */}
            <UsageLimitsDisplay
              showUsageLimit={showUsageLimit}
              onShowUsageLimit={setShowUsageLimit}
            />

            <UserTableDisplay
              users={users}
              loading={usersLoading}
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
                    await handleUpdateUser(userData, selectedUser.id);
                  } else {
                    await handleCreateUser(userData);
                  }
                } catch (error) {
                  console.error("Error in form submission:", error);
                  throw error;
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
              usageData={userUsageData}
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
    </AuthGuard>
  );
}
