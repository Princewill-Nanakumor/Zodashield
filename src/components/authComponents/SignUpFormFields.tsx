"use client";

import { useState, useEffect } from "react";
import {
  UseFormRegister,
  Control,
  FieldErrors,
  UseFormSetValue,
} from "react-hook-form";
import { Controller } from "react-hook-form";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Globe,
} from "lucide-react";
import { SignUpSchema } from "@/schemas";
import * as z from "zod";
import { PasswordStrength } from "./PasswordStrength";
import { PhoneInputField } from "./PhoneInputField";
import {
  Select,
  countryOptions,
  SelectOption,
  CustomOption,
  CustomSingleValue,
} from "../../components/user-management/CountrySelect";
import { Country } from "react-phone-number-input";
import { getCountrySelectStyles } from "./CountrySelectStyles";

type SignUpFormData = z.infer<typeof SignUpSchema>;

interface SignUpFormFieldsProps {
  register: UseFormRegister<SignUpFormData>;
  control: Control<SignUpFormData>;
  errors: FieldErrors<SignUpFormData>;
  loading: boolean;
  setValue: UseFormSetValue<SignUpFormData>;
  watchedPassword: string;
}

export function SignUpFormFields({
  register,
  control,
  errors,
  loading,
  setValue,
  watchedPassword,
}: SignUpFormFieldsProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<SelectOption | null>(
    null
  );
  const [isClient, setIsClient] = useState(false);

  // Fix hydration issue by only rendering the select on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleCountryChange = (option: SelectOption | null) => {
    setSelectedCountry(option);
    setValue("country", option?.label || "", {
      shouldValidate: true,
      shouldDirty: true,
    });

    // Update phone number with new country code (without space)
    if (option) {
      const currentPhone = control._formValues.phoneNumber || "";
      const phoneWithoutCode = currentPhone.replace(/^\+\d+\s?/, "");
      const newPhone = option.phoneCode + phoneWithoutCode; // Remove the space
      setValue("phoneNumber", newPhone, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const handlePhoneChange = (value: string) => {
    setValue("phoneNumber", value, {
      shouldValidate: true, // This triggers validation immediately
      shouldDirty: true, // This marks the field as changed by user
    });
  };
  return (
    <>
      {/* Name Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* First Name */}
        <div>
          <div className="relative flex items-center">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 pointer-events-none" />
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              {...register("firstName")}
              className={`pl-10 sm:pl-12 h-10 sm:h-12 w-full px-3 rounded-lg border text-sm sm:text-base ${
                errors.firstName
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
              } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:border-transparent transition-colors`}
              placeholder="First Name"
              disabled={loading}
            />
          </div>
          {errors.firstName && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              {errors.firstName.message}
            </p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <div className="relative flex items-center">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 pointer-events-none" />
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              {...register("lastName")}
              className={`pl-10 sm:pl-12 h-10 sm:h-12 w-full px-3 rounded-lg border text-sm sm:text-base ${
                errors.lastName
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
              } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:border-transparent transition-colors`}
              placeholder="Last Name"
              disabled={loading}
            />
          </div>
          {errors.lastName && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

      {/* Email Field */}
      <div>
        <div className="relative flex items-center">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 pointer-events-none" />
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
            className={`pl-10 sm:pl-12 h-10 sm:h-12 w-full px-3 rounded-lg border text-sm sm:text-base ${
              errors.email
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
            } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:border-transparent transition-colors`}
            placeholder="Email Address"
            disabled={loading}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Country Select */}
      <div>
        <div className="relative">
          {!selectedCountry && (
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 pointer-events-none z-10" />
          )}
          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              <>
                {isClient ? (
                  <Select
                    value={selectedCountry}
                    onChange={(option) => {
                      handleCountryChange(option as SelectOption);
                      field.onChange(option ? option.label : "");
                    }}
                    options={countryOptions}
                    placeholder="Select a country"
                    isDisabled={loading}
                    isClearable
                    styles={getCountrySelectStyles(!!errors.country)}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    components={{
                      Option: CustomOption,
                      SingleValue: CustomSingleValue,
                    }}
                    menuPlacement="top"
                    instanceId="country-select"
                  />
                ) : (
                  // Fallback for SSR
                  <div className="h-10 sm:h-12 w-full pl-10 sm:pl-12 px-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center">
                    Select a country
                  </div>
                )}
              </>
            )}
          />
        </div>
        {errors.country && (
          <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            {errors.country.message}
          </p>
        )}
      </div>

      {/* Phone Input */}
      <div>
        <Controller
          name="phoneNumber"
          control={control}
          render={({ field }) => (
            <PhoneInputField
              value={field.value || ""}
              onChange={handlePhoneChange}
              defaultCountry={selectedCountry?.value as Country | undefined}
              isLoading={loading}
              error={errors.phoneNumber?.message}
              placeholder="Enter phone number"
              selectedCountry={selectedCountry}
            />
          )}
        />
      </div>

      {/* Password */}
      <div>
        <div className="relative flex items-center">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 pointer-events-none" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            {...register("password")}
            className={`pl-10 sm:pl-12 pr-10 sm:pr-12 h-10 sm:h-12 w-full px-3 rounded-lg border text-sm sm:text-base ${
              errors.password
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
            } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:border-transparent transition-colors`}
            placeholder="Password"
            disabled={loading}
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            {errors.password.message}
          </p>
        )}
        <PasswordStrength password={watchedPassword} />
      </div>

      {/* Confirm Password */}
      <div>
        <div className="relative flex items-center">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 pointer-events-none" />
          <input
            id="confirmPassword"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            {...register("confirmPassword")}
            className={`pl-10 sm:pl-12 pr-10 sm:pr-12 h-10 sm:h-12 w-full px-3 rounded-lg border text-sm sm:text-base ${
              errors.confirmPassword
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
            } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:border-transparent transition-colors`}
            placeholder="Confirm Password"
            disabled={loading}
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            onClick={() => setShowConfirm((v) => !v)}
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? (
              <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
            <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            {errors.confirmPassword.message}
          </p>
        )}
      </div>
    </>
  );
}
