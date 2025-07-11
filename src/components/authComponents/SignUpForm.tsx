"use client";

import { useState, useEffect } from "react";
import { useForm, Controller, SubmitHandler, Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  User,
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  Phone,
  AlertCircle,
} from "lucide-react";
import { Inter } from "next/font/google";
import { SignUpSchema } from "@/schemas";
import * as z from "zod";
import { FormError } from "./FormError";
import { FormSuccess } from "./FormSucess";
import { PasswordStrength } from "./PasswordStrength";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "../../app/styles/phone-input-dark.css";
import {
  Select,
  countryOptions,
  customStyles,
  CustomOption,
  CustomSingleValue,
  SelectOption,
  DropdownIndicator,
} from "./SelectedCountry";
import { CustomPlaceholder } from "./GlobeplaceHolder";

const inter = Inter({ subsets: ["latin"] });

type SignUpFormData = z.infer<typeof SignUpSchema>;

interface ClientSideSelectProps {
  control: Control<SignUpFormData>;
  handleCountryChange: (option: SelectOption | null) => void;
  loading: boolean;
}

export default function SignUpForm() {
  const router = useRouter();
  const { data: session } = useSession();
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<SelectOption | null>(
    null
  );
  const [phone, setPhone] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    setValue,
    watch,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      country: "",
      phoneNumber: "",
    },
  });

  const watchedPassword = watch("password");

  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  const handleCountryChange = (option: SelectOption | null) => {
    setSelectedCountry(option);
    setValue("country", option?.label || "");
    if (option) {
      setPhone(option.phoneCode);
      setValue("phoneNumber", option.phoneCode);
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    setValue("phoneNumber", value);
  };

  const onSubmit: SubmitHandler<SignUpFormData> = async (data) => {
    setFormError("");
    setFormSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || "Something went wrong");
      }

      setFormSuccess("Account created successfully! Redirecting to login...");

      // Reset the form
      reset();

      // Auto-login for new admin user
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: unknown) {
      setFormError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during sign up"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 ${inter.className}`}
    >
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
          Create your account
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 mt-2">
          Start your journey with us today! Youll become an administrator.
        </p>
      </div>

      <form
        className="space-y-3 sm:space-y-4 md:space-y-6"
        onSubmit={handleSubmit(onSubmit)}
      >
        <FormError
          message={
            formError ||
            errors.firstName?.message ||
            errors.lastName?.message ||
            errors.email?.message ||
            errors.password?.message ||
            errors.confirmPassword?.message ||
            errors.phoneNumber?.message ||
            errors.country?.message
          }
        />
        <FormSuccess message={formSuccess} />

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
          <ClientSideSelect
            control={control}
            handleCountryChange={handleCountryChange}
            loading={loading}
          />
          {errors.country && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              {errors.country.message}
            </p>
          )}
        </div>

        {/* Phone Input */}
        <div>
          <div className="relative flex items-center">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 pointer-events-none z-10" />
            <Controller
              name="phoneNumber"
              control={control}
              render={({ field }) => (
                <PhoneInput
                  {...field}
                  country={selectedCountry?.value.toLowerCase() || "us"}
                  value={phone}
                  countryCodeEditable={false}
                  enableSearch={false}
                  onChange={(value) => {
                    handlePhoneChange(value);
                    field.onChange(value);
                  }}
                  inputClass={`!pl-10 sm:!pl-12 !h-10 sm:!h-12 !w-full !rounded-lg !text-sm sm:!text-base ${
                    errors.phoneNumber
                      ? "!border-red-500 focus:!border-red-500 focus:!ring-red-500"
                      : "!border-gray-300 focus:!border-indigo-500 focus:!ring-indigo-500"
                  } !dark:border-gray-600 !bg-white !dark:bg-gray-700 !text-gray-900 !dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors`}
                  containerClass="!w-full"
                  buttonClass="hidden"
                  disabled={loading}
                  placeholder="Phone Number"
                  disableDropdown={true}
                  inputProps={{
                    name: "phoneNumber",
                    required: true,
                  }}
                />
              )}
            />
          </div>
          {errors.phoneNumber && (
            <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              {errors.phoneNumber.message}
            </p>
          )}
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
          <PasswordStrength password={watchedPassword || ""} />
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="group relative w-full flex justify-center py-2.5 sm:py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center">
              <Loader2 className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
              Creating account...
            </span>
          ) : (
            <span className="flex items-center">
              Sign up
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </span>
          )}
        </button>

        {/* Sign In Link */}
        <div className="text-center text-xs sm:text-sm">
          <Link
            href="/signin"
            className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}

function ClientSideSelect({
  control,
  handleCountryChange,
  loading,
}: ClientSideSelectProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <input
        type="text"
        className="h-10 sm:h-12 w-full px-3 rounded-lg border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base text-gray-900 dark:text-white bg-white dark:bg-gray-700"
        placeholder="Loading countries..."
        disabled
      />
    );
  }

  return (
    <Controller
      name="country"
      control={control}
      render={({ field }) => (
        <Select
          {...field}
          options={countryOptions}
          styles={customStyles}
          components={{
            Option: CustomOption,
            SingleValue: CustomSingleValue,
            DropdownIndicator,
            Placeholder: CustomPlaceholder,
          }}
          placeholder="Select Country"
          isDisabled={loading}
          onChange={(option) => {
            handleCountryChange(option as SelectOption);
            field.onChange(option ? option.label : "");
          }}
          value={countryOptions.find((opt) => opt.label === field.value)}
          classNamePrefix="react-select"
        />
      )}
    />
  );
}
