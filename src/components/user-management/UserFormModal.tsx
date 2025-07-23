"use client";
import { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";
import { z } from "zod";
import "react-phone-input-2/lib/style.css";
import "../../app/styles/phone-input-dark.css";
import { CountrySelect } from "./CountrySelect";
import { PhoneNumberInput } from "./PhoneNumberInput";
import {
  UserFormCreateSchema,
  UserFormEditSchema,
  UserFormCreateData,
  UserFormEditData,
} from "@/schemas/UserFormSchema";
import {
  countryOptions,
  SelectOption,
} from "../authComponents/SelectedCountry";
import { NameFields } from "./NameFields";
import { EmailField } from "./EmailField";
import { PasswordField } from "./PasswordField";

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
              <CountrySelect
                value={selectedCountry}
                error={getFieldError("country")}
                isLoading={isLoading}
                onChange={handleCountryChange}
              />
              <PhoneNumberInput
                value={formData.phoneNumber}
                error={getFieldError("phoneNumber")}
                isLoading={isLoading}
                country={selectedCountry?.value?.toLowerCase() || "us"}
                onChange={handlePhoneChange}
              />
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
