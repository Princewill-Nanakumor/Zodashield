"use client";
import { useSession } from "next-auth/react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon, Shield } from "lucide-react";
import { UserFormModal } from "./UserFormModal";
import { PasswordResetModal } from "../dashboardComponents/PasswordRestModal";
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

  const handleUserCreated = useCallback(
    (user: User) => {
      onUserCreated?.(user);
      setUsers((prev) => {
        const filtered = prev.filter((u) => u.id !== user.id);
        return [user, ...filtered];
      });
      setShowModal(false);
      setSelectedUser(null);
    },
    [onUserCreated]
  );

  const handleUserUpdated = useCallback(
    (user: User) => {
      onUserUpdated?.(user);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));
      setShowModal(false);
      setSelectedUser(null);
    },
    [onUserUpdated]
  );

  const handleUserDeleted = useCallback(
    (userId: string) => {
      onUserDeleted?.(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    },
    [onUserDeleted]
  );

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
      <UserDataManager onUsersLoaded={setUsers} onLoadingChange={setLoading}>
        <UserCRUDOperations
          onUserCreated={handleUserCreated}
          onUserUpdated={handleUserUpdated}
          onUserDeleted={handleUserDeleted}
          onRefreshUsers={() => {}}
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
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 !text-white"
                    onClick={() => {
                      setSelectedUser(null);
                      setShowModal(true);
                    }}
                  >
                    <PlusIcon className="h-4 w-4" />
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
                      const updatedUser = await handleUpdateUser(
                        userData,
                        selectedUser.id
                      );
                      handleUserUpdated(updatedUser);
                    } else {
                      const newUser = await handleCreateUser(userData);
                      handleUserCreated(newUser);
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
