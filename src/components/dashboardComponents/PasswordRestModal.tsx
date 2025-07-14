// src/components/dashboardComponents/PasswordResetModal.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => Promise<void>;
  userEmail: string;
}

export function PasswordResetModal({
  isOpen,
  onClose,
  onSubmit,
  userEmail,
}: PasswordResetModalProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setIsLoading(true);
      await onSubmit(password);
      setPassword("");
      setConfirmPassword("");
      onClose();
    } catch (error) {
      console.error("Error resetting password:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="pb-4">
          <DialogTitle>Reset Password</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              User Email
            </Label>
            <Input
              id="email"
              value={userEmail}
              disabled
              className="bg-gray-100 dark:bg-gray-700"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              New Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              className="transition-colors focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="transition-colors focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="px-4 py-2">
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
