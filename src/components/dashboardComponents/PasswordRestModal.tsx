"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NewPasswordSchema } from "@/schemas";
import { z } from "zod";

type NewPasswordInput = z.infer<typeof NewPasswordSchema>;

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<NewPasswordInput>({
    resolver: zodResolver(NewPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onFormSubmit = async (data: NewPasswordInput) => {
    setServerError("");
    setIsLoading(true);
    try {
      await onSubmit(data.password);
      reset();
      onClose();
    } catch {
      setServerError("Error resetting password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper for input classes
  const inputClass = (hasError: boolean) =>
    `pl-9 pr-9 h-9 w-full rounded-md border text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 transition-colors ${
      hasError
        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
        : "border-input focus:border-indigo-500 focus:ring-indigo-500"
    }`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="pb-4">
          <DialogTitle>Reset Password</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">
              User Email
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="email"
                value={userEmail}
                disabled
                className="pl-9 h-9 w-full rounded-md border border-input bg-gray-100 dark:bg-gray-800 text-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* New Password Field */}
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium">
              New Password
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
                placeholder="Enter new password"
                disabled={isLoading}
                className={inputClass(!!errors.password)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-600 mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </label>
            <div className="relative mt-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword")}
                placeholder="Confirm new password"
                disabled={isLoading}
                className={inputClass(!!errors.confirmPassword)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-600 mt-1">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Error Message */}
          {serverError && (
            <div className="p-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md">
              {serverError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              size="sm"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 !text-white"
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
