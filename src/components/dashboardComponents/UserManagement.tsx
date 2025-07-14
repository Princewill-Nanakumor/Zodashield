"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
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

  const handleRefreshUsers = () => {
    // This will be called by the UserDataManager when data is refreshed
    setUsers(users); // Trigger re-render
  };

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen bg-background dark:bg-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 dark:border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <UserDataManager onUsersLoaded={setUsers} onLoadingChange={setLoading}>
        <UserCRUDOperations
          onUserCreated={onUserCreated}
          onUserUpdated={onUserUpdated}
          onUserDeleted={onUserDeleted}
          onRefreshUsers={handleRefreshUsers}
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
                onSubmit={
                  selectedUser
                    ? (userData) => handleUpdateUser(userData, selectedUser.id)
                    : handleCreateUser
                }
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
