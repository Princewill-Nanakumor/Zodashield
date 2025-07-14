// src/components/user-management/UserTableDisplay.tsx
"use client";

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
import { Pencil, Trash, KeyRound } from "lucide-react";

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

interface UserTableDisplayProps {
  users: User[];
  loading: boolean;
  filterActiveOnly: boolean;
  showActions: boolean;
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onResetPassword: (userId: string) => void;
}

export function UserTableDisplay({
  users,
  loading,
  filterActiveOnly,
  showActions,
  onEditUser,
  onDeleteUser,
  onResetPassword,
}: UserTableDisplayProps) {
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

  const filteredUsers = filterActiveOnly
    ? users.filter((user) => user.status === "ACTIVE")
    : users;

  return (
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
                    variant={user.status === "ACTIVE" ? "success" : "secondary"}
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
                      onClick={() => onEditUser(user)}
                      className="hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onResetPassword(user.id)}
                      className="hover:bg-gray-100 dark:hover:bg-gray-700 dark:border-gray-600"
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteUser(user.id)}
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
  );
}
