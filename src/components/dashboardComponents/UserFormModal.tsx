"use client";

import { useState, useEffect } from "react";
import { COUNTRIES } from "./UserFormConstants";
import { UserFormData, UserFormSchema } from "@/schemas/UserFormSchema";
import { z } from "zod";
import { User, Mail, Lock, Phone, Globe, Eye, EyeOff, X } from "lucide-react";
import { UserRoleStatusPermissions } from "./RoleStatusPermissions";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: UserFormData) => Promise<void>;
  initialData?: UserFormData;
  mode: "create" | "edit";
}

export function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: UserFormModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<UserFormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
    country: "",
    role: "AGENT",
    status: "ACTIVE",
    permissions: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          phoneNumber: "",
          country: "",
          role: "AGENT",
          status: "ACTIVE",
          permissions: [],
        });
      }
      setErrors({});
      setGeneralError(null);
    }
  }, [isOpen, initialData]);

  const handleInputChange = (
    field: keyof UserFormData,
    value: string | string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
    // Clear general error when user starts typing
    if (generalError) {
      setGeneralError(null);
    }
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    const newPermissions = checked
      ? [...formData.permissions, permission]
      : formData.permissions.filter((p: string) => p !== permission);
    handleInputChange("permissions", newPermissions);
  };

  const validateForm = (): boolean => {
    try {
      UserFormSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMap: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) {
            errorMap[err.path[0] as string] = err.message;
          }
        });
        setErrors(errorMap);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prevent double submission
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setGeneralError(null);

    try {
      await onSubmit(formData);

      onClose();
    } catch (error: unknown) {
      if (error instanceof Error) {
        // Check if this is an email conflict error
        if (error.message.toLowerCase().includes("email")) {
          setErrors({
            ...errors,
            email: error.message,
          });
        } else {
          setGeneralError(error.message);
        }
      } else {
        setGeneralError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldError = (field: string) => errors[field] || "";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {mode === "create" ? "Add New User" : "Edit User"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 text-2xl font-bold transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* General Error Display */}
          {generalError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 text-red-500 dark:text-red-400 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm text-red-600 dark:text-red-400">
                  {generalError}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                      getFieldError("firstName")
                        ? "border-red-500 dark:border-red-400"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="First Name"
                  />
                </div>
                {getFieldError("firstName") && (
                  <p className="text-xs text-red-500 dark:text-red-400">
                    {getFieldError("firstName")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                      getFieldError("lastName")
                        ? "border-red-500 dark:border-red-400"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="Last Name"
                  />
                </div>
                {getFieldError("lastName") && (
                  <p className="text-xs text-red-500 dark:text-red-400">
                    {getFieldError("lastName")}
                  </p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-200"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                    getFieldError("email")
                      ? "border-red-500 dark:border-red-400"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="Email Address"
                />
              </div>
              {getFieldError("email") && (
                <p className="text-xs text-red-500 dark:text-red-400">
                  {getFieldError("email")}
                </p>
              )}
            </div>

            {/* Password Field (only for create mode) */}
            {mode === "create" && (
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password || ""}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className={`w-full pl-10 pr-10 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                      getFieldError("password")
                        ? "border-red-500 dark:border-red-400"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {getFieldError("password") && (
                  <p className="text-xs text-red-500 dark:text-red-400">
                    {getFieldError("password")}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Minimum 8 characters required
                </p>
              </div>
            )}

            {/* Phone and Country Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      handleInputChange("phoneNumber", e.target.value)
                    }
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                      getFieldError("phoneNumber")
                        ? "border-red-500 dark:border-red-400"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="Phone Number"
                  />
                </div>
                {getFieldError("phoneNumber") && (
                  <p className="text-xs text-red-500 dark:text-red-400">
                    {getFieldError("phoneNumber")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="country"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Country
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <select
                    id="country"
                    value={formData.country}
                    onChange={(e) =>
                      handleInputChange("country", e.target.value)
                    }
                    className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      getFieldError("country")
                        ? "border-red-500 dark:border-red-400"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    <option value="">Select country</option>
                    {COUNTRIES.map((country) => (
                      <option key={country.value} value={country.value}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                </div>
                {getFieldError("country") && (
                  <p className="text-xs text-red-500 dark:text-red-400">
                    {getFieldError("country")}
                  </p>
                )}
              </div>
            </div>

            {/* Role, Status, and Permissions Component */}
            <UserRoleStatusPermissions
              formData={formData}
              errors={errors}
              onRoleChange={(value) => handleInputChange("role", value)}
              onStatusChange={(value) => handleInputChange("status", value)}
              onPermissionChange={handlePermissionChange}
              disabled={isLoading}
            />

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {isLoading
                  ? "Creating..."
                  : mode === "create"
                    ? "Create User"
                    : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
