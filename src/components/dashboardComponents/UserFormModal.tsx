"use client";

import { useState, useEffect } from "react";

interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phoneNumber: string;
  country: string;
  role: string;
  status: string;
  permissions: string[];
}

interface ValidationError {
  field: string;
  message: string;
}

const validateUserForm = (data: UserFormData): ValidationError[] => {
  const errors: ValidationError[] = [];

  // First name validation
  if (!data.firstName || data.firstName.trim() === "") {
    errors.push({ field: "firstName", message: "First name is required" });
  } else if (data.firstName.length < 2) {
    errors.push({
      field: "firstName",
      message: "First name must be at least 2 characters",
    });
  }

  // Last name validation
  if (!data.lastName || data.lastName.trim() === "") {
    errors.push({ field: "lastName", message: "Last name is required" });
  } else if (data.lastName.length < 2) {
    errors.push({
      field: "lastName",
      message: "Last name must be at least 2 characters",
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || data.email.trim() === "") {
    errors.push({ field: "email", message: "Email is required" });
  } else if (!emailRegex.test(data.email)) {
    errors.push({ field: "email", message: "Invalid email address" });
  }

  // Password validation (only for create mode)
  if (data.password !== undefined && data.password !== "") {
    if (data.password.length < 8) {
      errors.push({
        field: "password",
        message: "Password must be at least 8 characters",
      });
    } else if (!/[A-Z]/.test(data.password)) {
      errors.push({
        field: "password",
        message: "Password must contain at least one uppercase letter",
      });
    } else if (!/[0-9]/.test(data.password)) {
      errors.push({
        field: "password",
        message: "Password must contain at least one number",
      });
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(data.password)) {
      errors.push({
        field: "password",
        message: "Password must contain at least one special character",
      });
    }
  }

  // Phone number validation
  if (!data.phoneNumber || data.phoneNumber.trim() === "") {
    errors.push({ field: "phoneNumber", message: "Phone number is required" });
  }

  // Country validation
  if (!data.country || data.country.trim() === "") {
    errors.push({ field: "country", message: "Country is required" });
  }

  // Role validation
  if (!data.role || data.role.trim() === "") {
    errors.push({ field: "role", message: "Role is required" });
  }

  // Status validation
  if (!data.status || data.status.trim() === "") {
    errors.push({ field: "status", message: "Status is required" });
  }

  return errors;
};

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: UserFormData) => Promise<void>;
  initialData?: UserFormData;
  mode: "create" | "edit";
}

const ROLES = [
  { value: "ADMIN", label: "Administrator" },
  { value: "SUBADMIN", label: "Sub Administrator" },
  { value: "AGENT", label: "Agent" },
];

const PERMISSIONS = [
  { value: "ASSIGN_LEADS", label: "Assign Leads" },
  { value: "DELETE_COMMENTS", label: "Delete Comments" },
  { value: "VIEW_PHONE_NUMBERS", label: "View Phone Numbers" },
  { value: "VIEW_EMAILS", label: "View Emails" },
  { value: "MANAGE_USERS", label: "Manage Users" },
  { value: "EDIT_LEAD_STATUS", label: "Edit Lead Status" },
];

const COUNTRIES = [
  { value: "us", label: "United States" },
  { value: "ca", label: "Canada" },
  { value: "uk", label: "United Kingdom" },
  { value: "au", label: "Australia" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "es", label: "Spain" },
  { value: "it", label: "Italy" },
  { value: "jp", label: "Japan" },
  { value: "cn", label: "China" },
  { value: "in", label: "India" },
  { value: "br", label: "Brazil" },
  { value: "mx", label: "Mexico" },
  { value: "ar", label: "Argentina" },
  { value: "cl", label: "Chile" },
  { value: "co", label: "Colombia" },
  { value: "pe", label: "Peru" },
  { value: "ve", label: "Venezuela" },
  { value: "ec", label: "Ecuador" },
  { value: "bo", label: "Bolivia" },
  { value: "py", label: "Paraguay" },
  { value: "uy", label: "Uruguay" },
  { value: "gy", label: "Guyana" },
  { value: "sr", label: "Suriname" },
  { value: "gf", label: "French Guiana" },
  { value: "fk", label: "Falkland Islands" },
];

export function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: UserFormModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    const newPermissions = checked
      ? [...formData.permissions, permission]
      : formData.permissions.filter((p: string) => p !== permission);
    handleInputChange("permissions", newPermissions);
  };

  const validateForm = (): boolean => {
    const validationErrors = validateUserForm(formData);
    const errorMap: Record<string, string> = {};

    validationErrors.forEach((error) => {
      errorMap[error.field] = error.message;
    });

    setErrors(errorMap);
    return validationErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldError = (field: string) => errors[field] || "";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === "create" ? "Add New User" : "Edit User"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700"
                >
                  First Name
                </label>
                <div className="relative">
                  <input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      getFieldError("firstName")
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="First Name"
                  />
                </div>
                {getFieldError("firstName") && (
                  <p className="text-xs text-red-500">
                    {getFieldError("firstName")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Last Name
                </label>
                <div className="relative">
                  <input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      getFieldError("lastName")
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Last Name"
                  />
                </div>
                {getFieldError("lastName") && (
                  <p className="text-xs text-red-500">
                    {getFieldError("lastName")}
                  </p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  getFieldError("email") ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Email Address"
              />
              {getFieldError("email") && (
                <p className="text-xs text-red-500">{getFieldError("email")}</p>
              )}
            </div>

            {/* Password Field (only for create mode) */}
            {mode === "create" && (
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password || ""}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      getFieldError("password")
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                {getFieldError("password") && (
                  <p className="text-xs text-red-500">
                    {getFieldError("password")}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Minimum 8 characters required
                </p>
              </div>
            )}

            {/* Phone and Country Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-gray-700"
                >
                  Phone Number
                </label>
                <input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    handleInputChange("phoneNumber", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    getFieldError("phoneNumber")
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  placeholder="Phone Number"
                />
                {getFieldError("phoneNumber") && (
                  <p className="text-xs text-red-500">
                    {getFieldError("phoneNumber")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="country"
                  className="block text-sm font-medium text-gray-700"
                >
                  Country
                </label>
                <select
                  id="country"
                  value={formData.country}
                  onChange={(e) => handleInputChange("country", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    getFieldError("country")
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map((country) => (
                    <option key={country.value} value={country.value}>
                      {country.label}
                    </option>
                  ))}
                </select>
                {getFieldError("country") && (
                  <p className="text-xs text-red-500">
                    {getFieldError("country")}
                  </p>
                )}
              </div>
            </div>

            {/* Role and Status Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700"
                >
                  Role
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => handleInputChange("role", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    getFieldError("role") ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select role</option>
                  {ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                {getFieldError("role") && (
                  <p className="text-xs text-red-500">
                    {getFieldError("role")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700"
                >
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    getFieldError("status")
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                >
                  <option value="">Select status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
                {getFieldError("status") && (
                  <p className="text-xs text-red-500">
                    {getFieldError("status")}
                  </p>
                )}
              </div>
            </div>

            {/* Permissions */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Permissions
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {PERMISSIONS.map((permission) => (
                  <div
                    key={permission.value}
                    className="flex items-center space-x-2"
                  >
                    <input
                      type="checkbox"
                      id={permission.value}
                      checked={formData.permissions.includes(permission.value)}
                      onChange={(e) =>
                        handlePermissionChange(
                          permission.value,
                          e.target.checked
                        )
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor={permission.value}
                      className="text-sm text-gray-700"
                    >
                      {permission.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading
                  ? "Processing..."
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
