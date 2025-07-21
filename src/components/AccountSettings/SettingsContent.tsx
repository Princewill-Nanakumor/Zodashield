"use client";

import React, { useState } from "react";
import { AlertTriangle, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { signOut } from "next-auth/react";
import { SettingsSidebar } from "./SettingsSidebar";
import { DeleteAccountDialog } from "./DeleteAccountDialog";
import { ChangePasswordSection } from "./ChangePasswordSection";
import { PasswordInput } from "./PasswordInput";
import { DateTimeSettingsSection } from "./DateTimeSettingsSection";

export function SettingsContent() {
  const { toast } = useToast();

  // Password reset states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // Delete account states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handlePasswordReset = async () => {
    setPasswordError(null);
    setFieldErrors({});
    if (
      !currentPassword.trim() ||
      !newPassword.trim() ||
      !confirmPassword.trim()
    ) {
      setFieldErrors({
        currentPassword: !currentPassword.trim()
          ? "Current password is required"
          : undefined,
        newPassword: !newPassword.trim()
          ? "New password is required"
          : undefined,
        confirmPassword: !confirmPassword.trim()
          ? "Please confirm your new password"
          : undefined,
      });
      setPasswordError(null);
      return;
    }
    if (newPassword !== confirmPassword) {
      setFieldErrors({ confirmPassword: "New passwords do not match" });
      return;
    }
    setIsResettingPassword(true);
    try {
      console.log("Sending request...");
      const response = await fetch("/api/users/reset-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await response.json();
      console.log("API response:", data);
      if (!response.ok) {
        if (data.errors) {
          setFieldErrors(data.errors);
        } else if (data.error) {
          setPasswordError(data.error);
        } else {
          setPasswordError("Failed to update password");
        }
        return;
      }
      toast({
        title: "Password Updated",
        description:
          "Your password has been successfully updated. Please log in again.",
        variant: "success",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        signOut({ callbackUrl: "/signin" });
      }, 1500);
    } catch {
      setPasswordError("An error occurred while updating your password");
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Delete account handler
  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setDeleteError("Please enter your password");
      return;
    }
    setIsDeleting(true);
    setDeleteError("");
    try {
      const response = await fetch("/api/users/delete-account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword }),
      });
      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Account Deleted",
          description: "Your account has been successfully deleted.",
        });
        setTimeout(() => {
          signOut({ callbackUrl: "/signin" });
        }, 2000);
      } else {
        setDeleteError(data.error || "Failed to delete account");
      }
    } catch {
      setDeleteError("An error occurred while deleting your account");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 rounded-lg border">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold dark:text-white text-gray-900 mb-2">
              Account Settings
            </h1>
            <p className="dark:text-gray-300 text-gray-600">
              Manage your password and account security
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Change Password Section */}
            <ChangePasswordSection
              currentPassword={currentPassword}
              setCurrentPassword={setCurrentPassword}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              showCurrentPassword={showCurrentPassword}
              setShowCurrentPassword={setShowCurrentPassword}
              showNewPassword={showNewPassword}
              setShowNewPassword={setShowNewPassword}
              showConfirmPassword={showConfirmPassword}
              setShowConfirmPassword={setShowConfirmPassword}
              isResettingPassword={isResettingPassword}
              passwordError={passwordError}
              fieldErrors={fieldErrors}
              handlePasswordReset={handlePasswordReset}
            />

            {/* Danger Zone Section */}
            <section className="dark:backdrop-blur-lg dark:bg-white/5 rounded-2xl p-6 shadow-lg dark:border dark:border-white/10 bg-white border border-red-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
                    Danger Zone
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Irreversible account actions
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    <strong>Warning:</strong> Once you delete your account,
                    there is no going back. This action will permanently remove
                    all your data and cannot be undone.
                  </p>
                </div>

                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex items-center gap-2"
                >
                  <UserX className="h-4 w-4" />
                  Delete Account
                </Button>
              </div>
            </section>
          </div>
          {/* Delete Account Dialog */}
          <DeleteAccountDialog
            open={showDeleteDialog}
            onClose={() => {
              setShowDeleteDialog(false);
              setDeletePassword("");
              setDeleteError("");
            }}
            onDelete={handleDeleteAccount}
            isDeleting={isDeleting}
            deletePassword={deletePassword}
            setDeletePassword={setDeletePassword}
            showDeletePassword={showDeletePassword}
            setShowDeletePassword={setShowDeletePassword}
            deleteError={deleteError}
            PasswordInput={PasswordInput}
          />

          {/* Right Column - Sidebar */}
          <div>
            <div>
              <SettingsSidebar />
            </div>
            <DateTimeSettingsSection />
          </div>
        </div>
      </div>
    </div>
  );
}
