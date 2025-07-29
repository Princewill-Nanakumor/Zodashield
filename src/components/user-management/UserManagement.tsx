// src/components/user-management/UserManagement.tsx
"use client";
import { useSession } from "next-auth/react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon, Shield, AlertTriangle, Users } from "lucide-react";
import { UserFormModal } from "./UserFormModal";
import { PasswordResetModal } from "../dashboardComponents/PasswordRestModal";
import { UserDataManager } from "../user-management/UserDataManager";
import { UserCRUDOperations } from "@/components/user-management/UserCRUDOperations";
import { UserTableDisplay } from "@/components/user-management/UserTableDisplay";
import { AuthGuard } from "@/components/user-management/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

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

interface UsageData {
  currentUsers: number;
  maxUsers: number;
  remainingUsers: number;
  canAddTeamMember: boolean;
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
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [showUsageLimit, setShowUsageLimit] = useState(false);

  const handleUserCreated = useCallback(
    (user: User) => {
      onUserCreated?.(user);
      setUsers((prev) => {
        const filtered = prev.filter((u) => u.id !== user.id);
        return [user, ...filtered];
      });
      setShowModal(false);
      setSelectedUser(null);
      // Update usage data
      if (usageData) {
        setUsageData({
          ...usageData,
          currentUsers: usageData.currentUsers + 1,
          remainingUsers: Math.max(0, usageData.remainingUsers - 1),
          canAddTeamMember: usageData.remainingUsers > 1,
        });
      }
    },
    [onUserCreated, usageData]
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
      // Update usage data
      if (usageData) {
        setUsageData({
          ...usageData,
          currentUsers: Math.max(0, usageData.currentUsers - 1),
          remainingUsers: usageData.remainingUsers + 1,
          canAddTeamMember: true,
        });
      }
    },
    [onUserDeleted, usageData]
  );

  const handleCreateUserClick = () => {
    if (usageData && !usageData.canAddTeamMember) {
      setShowUsageLimit(true);
      return;
    }
    setSelectedUser(null);
    setShowModal(true);
  };

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
      <UserDataManager
        onUsersLoaded={setUsers}
        onLoadingChange={setLoading}
        onUsageDataLoaded={setUsageData}
      >
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
                    onClick={handleCreateUserClick}
                    disabled={!!(usageData && !usageData.canAddTeamMember)}
                  >
                    <PlusIcon className="h-4 w-4" />
                    Create User
                  </Button>
                )}
              </div>

              {/* Usage Limits Display */}
              {usageData && (
                <Card className="border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center space-x-2 text-sm">
                      <Users className="h-4 w-4" />
                      <span>Team Members Usage</span>
                      {usageData.currentUsers >= usageData.maxUsers * 0.8 && (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{usageData.currentUsers} used</span>
                        <span>
                          {usageData.maxUsers === -1
                            ? "Unlimited"
                            : `${usageData.maxUsers} total`}
                        </span>
                      </div>
                      <Progress
                        value={
                          usageData.maxUsers === -1
                            ? 0
                            : (usageData.currentUsers / usageData.maxUsers) *
                              100
                        }
                        className={`${
                          usageData.currentUsers >= usageData.maxUsers
                            ? "bg-red-200"
                            : usageData.currentUsers >= usageData.maxUsers * 0.8
                              ? "bg-yellow-200"
                              : "bg-green-200"
                        }`}
                      />
                      {usageData.maxUsers !== -1 &&
                        usageData.remainingUsers > 0 && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {usageData.remainingUsers} members remaining
                          </p>
                        )}
                      {usageData.maxUsers !== -1 &&
                        usageData.remainingUsers === 0 && (
                          <p className="text-xs text-red-600 dark:text-red-400">
                            Limit reached - upgrade to add more team members
                          </p>
                        )}
                      {usageData.maxUsers === -1 && (
                        <p className="text-xs text-green-600 dark:text-green-400">
                          Unlimited team members
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Usage Limit Warning */}
              {showUsageLimit && usageData && (
                <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-red-800 dark:text-red-200">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Team Member Limit Reached</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-red-700 dark:text-red-300">
                        You have reached your team member limit. Upgrade your
                        subscription to add more team members.
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="outline"
                          className="text-red-600 dark:text-red-400"
                        >
                          {usageData.currentUsers}/{usageData.maxUsers} Members
                        </Badge>
                      </div>
                      <Button
                        onClick={() => (window.location.href = "/subscription")}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Upgrade Plan
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

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
                usageData={usageData}
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
