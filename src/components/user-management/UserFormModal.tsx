"use client";
import { useState, useEffect } from "react";
import { X, AlertCircle, Phone, Globe } from "lucide-react";
import { z } from "zod";
import PhoneInput, { Country } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import {
  Select,
  countryOptions,
  SelectOption,
  CustomOption,
  CustomSingleValue,
} from "./CountrySelect";
import {
  UserFormCreateSchema,
  UserFormEditSchema,
  UserFormCreateData,
  UserFormEditData,
} from "@/schemas/UserFormSchema";
import { NameFields } from "./NameFields";
import { EmailField } from "./EmailField";
import { PasswordField } from "./PasswordField";
import { StylesConfig } from "react-select";

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
        let phoneNumber = initialData.phoneNumber || "";
        if (phoneNumber && !phoneNumber.startsWith("+")) {
          phoneNumber = "+" + phoneNumber;
        }
        setFormData({ ...initialData, phoneNumber });
        const countryOption = countryOptions.find(
          (opt) => opt.label === initialData.country
        );
        setSelectedCountry(countryOption || null);
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
  };

  const handlePhoneChange = (value?: string) => {
    if (!value || value.startsWith("+")) {
      handleInputChange("phoneNumber", value || "");
    }
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
    setErrors({});

    try {
      await onSubmit(formData);
      onClose();
    } catch (error: unknown) {
      setIsLoading(false);
      if (typeof error === "string") {
        try {
          const parsed = JSON.parse(error);
          if (parsed && typeof parsed === "object") error = parsed;
        } catch {
          setGeneralError(error as string);
          return;
        }
      }
      if (
        typeof error === "object" &&
        error !== null &&
        "field" in error &&
        "message" in error &&
        typeof (error as { field: unknown }).field === "string" &&
        typeof (error as { message: unknown }).message === "string"
      ) {
        setErrors((prev) => ({
          ...prev,
          [(error as { field: string }).field]: (error as { message: string })
            .message,
        }));
        return;
      }
      if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message: unknown }).message === "string"
      ) {
        setGeneralError((error as { message: string }).message);
        return;
      }
      setGeneralError("An unexpected error occurred");
    }
  };

  const getFieldError = (field: string) => errors[field] || "";
  const getCountrySelectStyles = (): StylesConfig<SelectOption, false> => {
    const hasError = !!getFieldError("country");

    // Check if dark mode is active
    const isDarkMode =
      typeof window !== "undefined" &&
      document.documentElement.classList.contains("dark");

    return {
      container: (provided) => ({
        ...provided,
        width: "100%",
        minWidth: 0,
      }),
      control: (base, state) => ({
        ...base,
        minHeight: "38px",
        height: "38px",
        borderRadius: "0.5rem",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: hasError
          ? "#EF4444"
          : state.isFocused
            ? "#6366F1" // indigo-500
            : isDarkMode
              ? "#4B5563"
              : "#D1D5DB", // gray-600 for dark, gray-300 for light
        backgroundColor: isDarkMode ? "rgb(55 65 81)" : "#FFFFFF", // dark:bg-gray-700 or white
        color: isDarkMode ? "#F3F4F6" : "#111827", // gray-100 for dark, gray-900 for light
        fontSize: "0.875rem",
        fontFamily: "inherit",
        outline: "none",
        width: "100%",
        cursor: "pointer",
        transition: "none",
        boxShadow:
          hasError && state.isFocused
            ? "0 0 0 1px #EF4444" // red focus ring when error and focused
            : !hasError && state.isFocused
              ? "0 0 0 1px #6366F1" // indigo focus ring when no error and focused
              : "none",
        "&:hover": {
          borderColor: hasError
            ? "#EF4444"
            : state.isFocused
              ? "#6366F1"
              : isDarkMode
                ? "#4B5563"
                : "#D1D5DB",
        },
      }),
      valueContainer: (provided) => ({
        ...provided,
        height: "40px",
        padding: "0 0.75rem",
        display: "flex",
        alignItems: "center",
        minWidth: 0,
      }),
      singleValue: (provided) => ({
        ...provided,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "0.875rem",
        fontFamily: "inherit",
        color: isDarkMode ? "#F3F4F6" : "#111827", // gray-100 for dark, gray-900 for light
        marginLeft: 0,
        minWidth: 0,
        maxWidth: "100%",
      }),
      input: (provided) => ({
        ...provided,
        margin: 0,
        padding: 0,
        fontFamily: "inherit",
        color: isDarkMode ? "#F3F4F6" : "#111827", // gray-100 for dark, gray-900 for light
        minWidth: 0,
      }),
      placeholder: (provided) => ({
        ...provided,
        color: isDarkMode ? "#9CA3AF" : "#6B7280", // gray-400 for dark, gray-500 for light
        fontFamily: "inherit",
        marginLeft: 0,
        minWidth: 0,
        fontSize: "0.875rem",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }),
      option: (provided, state) => ({
        ...provided,
        display: "flex",
        alignItems: "center",
        padding: "8px 12px",
        fontSize: "0.875rem",
        fontFamily: "inherit",
        backgroundColor: state.isSelected
          ? isDarkMode
            ? "#312E81"
            : "#EEF2FF" // indigo-900 for dark, indigo-50 for light
          : state.isFocused
            ? isDarkMode
              ? "#374151"
              : "#F3F4F6" // gray-700 for dark, gray-100 for light
            : isDarkMode
              ? "#1F2937"
              : "#FFFFFF", // gray-800 for dark, white for light
        color: isDarkMode ? "#F3F4F6" : "#111827", // gray-100 for dark, gray-900 for light
        cursor: state.isDisabled ? "not-allowed" : "pointer",
        opacity: state.isDisabled ? 0.5 : 1,
        "&:active": {
          backgroundColor: isDarkMode ? "#312E81" : "#EEF2FF",
        },
      }),
      menu: (provided) => ({
        ...provided,
        fontFamily: "inherit",
        backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF", // gray-800 for dark, white for light
        color: isDarkMode ? "#F3F4F6" : "#111827", // gray-100 for dark, gray-900 for light
        borderRadius: "0.5rem",
        border: isDarkMode ? "1px solid #374151" : "1px solid #E5E7EB", // gray-700 for dark, gray-200 for light
        boxShadow: isDarkMode
          ? "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)"
          : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        marginTop: "4px",
        zIndex: 9999,
        minWidth: 0,
      }),
      menuList: (provided) => ({
        ...provided,
        padding: "2px",
        maxHeight: "120px",
        minWidth: 0,
        "::-webkit-scrollbar": {
          width: "6px",
        },
        "::-webkit-scrollbar-track": {
          background: isDarkMode ? "#374151" : "#F3F4F6",
          borderRadius: "3px",
        },
        "::-webkit-scrollbar-thumb": {
          background: isDarkMode ? "#818CF8" : "#9CA3AF",
          borderRadius: "3px",
        },
      }),
      dropdownIndicator: (provided) => ({
        ...provided,
        padding: "0 8px",
        color: isDarkMode ? "#9CA3AF" : "#6B7280", // gray-400 for dark, gray-500 for light
      }),
      indicatorSeparator: () => ({
        display: "none",
      }),
    };
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
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

          {/* General Error */}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <NameFields
              formData={formData}
              isLoading={isLoading}
              handleInputChange={handleInputChange}
              getFieldError={getFieldError}
            />

            <EmailField
              value={formData.email}
              error={getFieldError("email")}
              isLoading={isLoading}
              onChange={(value) => handleInputChange("email", value)}
            />

            {mode === "create" && (
              <PasswordField
                value={formData.password || ""}
                error={getFieldError("password")}
                isLoading={isLoading}
                onChange={(value) => handleInputChange("password", value)}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Country Select */}
              <div className="space-y-2">
                <Select
                  value={selectedCountry}
                  onChange={handleCountryChange}
                  options={countryOptions}
                  placeholder={
                    <div className="flex items-center gap-2">
                      <Globe className="h-5 w-4 text-gray-400 dark:text-gray-500" />
                      <span>Select a country</span>
                    </div>
                  }
                  isDisabled={isLoading}
                  isClearable
                  styles={getCountrySelectStyles()}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  components={{
                    Option: CustomOption,
                    SingleValue: CustomSingleValue,
                  }}
                  menuPlacement="top"
                />
                {getFieldError("country") && (
                  <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {getFieldError("country")}
                  </p>
                )}
              </div>

              {/* Phone Input */}
              <div className="space-y-2">
                <div className="relative">
                  <div
                    className={`
        phone-input-wrapper w-full px-3 py-2 rounded-lg border text-sm flex items-center
        ${isLoading ? "opacity-50 cursor-not-allowed" : ""}
        ${
          getFieldError("phoneNumber")
            ? "error border-red-500 focus:ring-red-500"
            : "border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
        }
        bg-white dark:bg-gray-700 
        text-gray-900 dark:text-white
        focus-within:outline-none focus-within:ring-2 focus-within:border-transparent
      `}
                  >
                    {/* Phone Icon */}
                    <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-3 flex-shrink-0" />

                    <PhoneInput
                      international
                      countryCallingCodeEditable={false}
                      defaultCountry={
                        selectedCountry?.value as Country | undefined
                      }
                      value={formData.phoneNumber}
                      onChange={handlePhoneChange}
                      disabled={isLoading}
                      placeholder="Enter phone number"
                      className="!border-none !bg-transparent !p-0 !m-0 !w-full"
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
            </div>

            {/* Form Actions */}
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
