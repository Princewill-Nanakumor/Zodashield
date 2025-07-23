"use client";

import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  X,
  AlertCircle,
} from "lucide-react";
import {
  UserFormCreateSchema,
  UserFormEditSchema,
  UserFormCreateData,
  UserFormEditData,
} from "@/schemas/UserFormSchema";
import { z } from "zod";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "../../app/styles/phone-input-dark.css";
import {
  Select,
  countryOptions,
  CustomOption,
  CustomSingleValue,
  SelectOption,
  DropdownIndicator,
} from "../authComponents/SelectedCountry";
import { CustomPlaceholder } from "../authComponents/GlobeplaceHolder";
import { StylesConfig, GroupBase } from "react-select";

export const customStyles: StylesConfig<
  SelectOption,
  false,
  GroupBase<SelectOption>
> = {
  control: (provided, state) => ({
    ...provided,
    minHeight: "40px",
    height: "40px",
    borderRadius: "0.5rem",
    borderColor: state.isFocused ? "#6366f1" : "#d1d5db",
    borderWidth: "1px",
    boxShadow: state.isFocused ? "0 0 0 1px #6366f1" : "none",
    backgroundColor: state.isDisabled ? "#f3f4f6" : "#fff",
    fontSize: "1rem",
    paddingLeft: "0.75rem",
    width: "100%",
    display: "flex",
    alignItems: "center",
    "&:hover": {
      borderColor: state.isFocused ? "#6366f1" : "#d1d5db",
    },
  }),
  valueContainer: (provided) => ({
    ...provided,
    minHeight: "40px",
    height: "40px",
    padding: "0 8px",
    display: "flex",
    alignItems: "center",
  }),
  input: (provided) => ({
    ...provided,
    margin: 0,
    padding: 0,
    alignSelf: "center",
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
    fontSize: "1rem",
    width: "100%",
    minWidth: "220px",
    marginTop: "4px",
  }),
  menuList: (provided) => ({
    ...provided,
    maxHeight: "180px",
    overflowY: "auto",
    paddingTop: 0,
    paddingBottom: 0,
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: "1rem",
    backgroundColor: state.isSelected
      ? "#6366f1"
      : state.isFocused
        ? "#f3f4f6"
        : "#fff",
    color: state.isSelected ? "#fff" : "#111827",
    padding: "8px 14px",
    cursor: "pointer",
    lineHeight: 1.4,
    wordBreak: "break-word",
  }),
  singleValue: (provided) => ({
    ...provided,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "calc(100% - 40px)",
    margin: 0,
    padding: 0,
    position: "relative",
    transform: "none",
    top: 0,
    left: 0,
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#6b7280",
    fontSize: "1rem",
    margin: 0,
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: "#6b7280",
    paddingRight: "0.75rem",
    paddingLeft: "0.5rem",
    svg: {
      width: "18px",
      height: "18px",
    },
  }),
};

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: UserFormCreateData | UserFormEditData) => Promise<void>;
  initialData?: UserFormEditData;
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
  const [formData, setFormData] = useState<
    UserFormCreateData | UserFormEditData
  >({
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
  const [selectedCountry, setSelectedCountry] = useState<SelectOption | null>(
    null
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
        setSelectedCountry(
          countryOptions.find((opt) => opt.label === initialData.country) ||
            null
        );
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
        setSelectedCountry(null);
      }
      setErrors({});
      setGeneralError(null);
      setIsLoading(false);
    }
  }, [isOpen, initialData]);

  const handleInputChange = (
    field: keyof (UserFormCreateData & UserFormEditData),
    value: string | string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
    if (generalError) {
      setGeneralError(null);
    }
  };

  const handleCountryChange = (option: SelectOption | null) => {
    setSelectedCountry(option);
    handleInputChange("country", option?.label || "");
    if (option) {
      handleInputChange("phoneNumber", option.phoneCode);
    }
  };

  const handlePhoneChange = (value: string) => {
    handleInputChange("phoneNumber", value);
  };

  const validateForm = (): boolean => {
    try {
      if (mode === "create") {
        UserFormCreateSchema.parse(formData);
      } else {
        UserFormEditSchema.parse(formData);
      }
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
    if (!validateForm()) return;
    if (isLoading) return;

    setIsLoading(true);
    setGeneralError(null);

    try {
      await onSubmit(formData);
      onClose(); // Only close on successful submission
    } catch (error: unknown) {
      setIsLoading(false);

      // Type guard for custom error object
      if (
        typeof error === "object" &&
        error !== null &&
        "field" in error &&
        "message" in error &&
        typeof (error as { field: unknown }).field === "string" &&
        typeof (error as { message: unknown }).message === "string"
      ) {
        setErrors({
          ...errors,
          [(error as { field: string }).field]: (error as { message: string })
            .message,
        });
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message: unknown }).message === "string"
      ) {
        setGeneralError((error as { message: string }).message);
      } else {
        setGeneralError("An unexpected error occurred");
      }
    }
  };

  const getFieldError = (field: string) => errors[field] || "";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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

          {generalError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 mr-2" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  {generalError}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="relative flex items-center">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className={`pl-10 h-10 w-full px-3 rounded-lg border text-sm ${
                      getFieldError("firstName")
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
                    } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:border-transparent transition-colors`}
                    placeholder="First Name"
                    disabled={isLoading}
                  />
                </div>
                {getFieldError("firstName") && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError("firstName")}
                  </p>
                )}
              </div>
              <div>
                <div className="relative flex items-center">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className={`pl-10 h-10 w-full px-3 rounded-lg border text-sm ${
                      getFieldError("lastName")
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
                    } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:border-transparent transition-colors`}
                    placeholder="Last Name"
                    disabled={isLoading}
                  />
                </div>
                {getFieldError("lastName") && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError("lastName")}
                  </p>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <div className="relative flex items-center">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className={`pl-10 h-10 w-full px-3 rounded-lg border text-sm ${
                    getFieldError("email")
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
                  } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:border-transparent transition-colors`}
                  placeholder="Email Address"
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              {getFieldError("email") && (
                <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {getFieldError("email")}
                </p>
              )}
            </div>

            {mode === "create" && (
              <div>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password || ""}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className={`pl-10 pr-10 h-10 w-full px-3 rounded-lg border text-sm ${
                      getFieldError("password")
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
                    } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:border-transparent transition-colors`}
                    placeholder="Password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {getFieldError("password") && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError("password")}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Minimum 8 characters, 1 uppercase, 1 number, 1 special
                  character
                </p>
              </div>
            )}

            {/* Phone and Country Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Country */}
              <div>
                <div className="relative flex items-center w-full">
                  <div className="w-full">
                    <Select
                      options={countryOptions}
                      styles={customStyles}
                      components={{
                        Option: CustomOption,
                        SingleValue: CustomSingleValue,
                        DropdownIndicator,
                        Placeholder: CustomPlaceholder,
                      }}
                      placeholder="Select Country"
                      value={selectedCountry}
                      onChange={handleCountryChange}
                      isDisabled={isLoading}
                      classNamePrefix="react-select"
                      menuPlacement="top"
                    />
                  </div>
                </div>
                {getFieldError("country") && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError("country")}
                  </p>
                )}
              </div>
              {/* Phone */}
              <div>
                <div className="relative flex items-center w-full">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                  <PhoneInput
                    country={selectedCountry?.value?.toLowerCase() || "us"}
                    value={formData.phoneNumber}
                    onChange={handlePhoneChange}
                    inputClass={`!pl-10 !h-10 !w-full !rounded-lg !text-sm !border ${
                      getFieldError("phoneNumber")
                        ? "!border-red-500 focus:!border-red-500 focus:!ring-red-500 focus:!ring-2"
                        : "!border-gray-300 dark:!border-gray-600 focus:!ring-indigo-500 focus:!ring-2"
                    } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:border-transparent transition-colors`}
                    buttonClass="hidden"
                    containerClass="!w-full"
                    disabled={isLoading}
                    placeholder="Phone Number"
                    disableDropdown={true}
                    inputProps={{
                      name: "phoneNumber",
                      required: true,
                    }}
                  />
                </div>
                {getFieldError("phoneNumber") && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError("phoneNumber")}
                  </p>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
