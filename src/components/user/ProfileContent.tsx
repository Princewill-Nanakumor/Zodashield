"use client";

import { Mail, Phone, Edit, Save, X, User, MapPin, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import PhoneInput, { Country } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import {
  Select,
  countryOptions,
  SelectOption,
  CustomOption,
  CustomSingleValue,
} from "../authComponents/SelectedCountry";
import { useState, useEffect } from "react";
import ProfileSidebar from "./ProfileSidebar";
import { StylesConfig } from "react-select";
import Image from "next/image";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  country: string;
  role: string;
  status: string;
  permissions: string[];
  createdBy: string;
  createdAt: string;
  lastLogin?: string;
}

interface ProfileContentProps {
  className?: string;
  profile: UserProfile;
  isEditing: boolean;
  editedProfile: Partial<UserProfile>;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onInputChange: (field: keyof UserProfile, value: string) => void;
  inputClass?: (editing: boolean) => string;
  isUpdating?: boolean;
}

export const ProfileContent: React.FC<ProfileContentProps> = ({
  className = "",
  profile,
  isEditing,
  editedProfile,
  onEdit,
  onSave,
  onCancel,
  onInputChange,
  inputClass = (editing) =>
    [
      "w-full px-4 py-2 dark:bg-white/5 dark:border dark:border-white/10 dark:text-white bg-gray-50 border border-gray-300 text-gray-900 rounded-lg text-base",
      editing
        ? "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        : "focus:outline-none",
    ].join(" "),
}) => {
  // Get initial country from profile or editedProfile
  const initialCountry =
    countryOptions.find(
      (opt) =>
        opt.label === (isEditing ? editedProfile.country : profile.country)
    ) || null;

  // State for country
  const [selectedCountry, setSelectedCountry] = useState<SelectOption | null>(
    initialCountry
  );

  // Effect to sync state when switching between edit/view modes
  useEffect(() => {
    const currentCountry =
      countryOptions.find(
        (opt) =>
          opt.label === (isEditing ? editedProfile.country : profile.country)
      ) || null;

    setSelectedCountry(currentCountry);
  }, [isEditing, editedProfile.country, profile.country]);

  const handleCountryChange = (option: SelectOption | null) => {
    setSelectedCountry(option);
    onInputChange("country", option?.label || "");
  };

  const handlePhoneChange = (value?: string) => {
    if (!value || value.startsWith("+")) {
      onInputChange("phoneNumber", value || "");
    }
  };

  // Format phone number to E.164 format
  const formatPhoneNumber = (phoneNumber: string): string => {
    if (!phoneNumber) return "";

    // If it already starts with +, return as is
    if (phoneNumber.startsWith("+")) {
      return phoneNumber;
    }

    // If it's just digits, assume it's a local number and add +1 (US)
    if (/^\d+$/.test(phoneNumber)) {
      return `+1${phoneNumber}`;
    }

    // If it doesn't match any pattern, return empty
    return "";
  };

  const getCountrySelectStyles = (): StylesConfig<SelectOption, false> => {
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
        minHeight: "42px",
        height: "42px",
        borderRadius: "0.5rem",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: state.isFocused
          ? "#6366F1" // indigo-500
          : isDarkMode
            ? "#4B5563"
            : "#D1D5DB", // gray-600 for dark, gray-300 for light
        backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#F9FAFB", // dark:bg-white/5 or gray-50
        color: isDarkMode ? "#F3F4F6" : "#111827", // gray-100 for dark, gray-900 for light
        fontSize: "1rem",
        fontFamily: "inherit",
        outline: "none",
        width: "100%",
        cursor: "pointer",
        transition: "none",
        boxShadow: state.isFocused
          ? "0 0 0 1px #6366F1" // indigo focus ring when focused
          : "none",
        "&:hover": {
          borderColor: state.isFocused
            ? "#6366F1"
            : isDarkMode
              ? "#4B5563"
              : "#D1D5DB",
        },
      }),
      valueContainer: (provided) => ({
        ...provided,
        height: "42px",
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
        fontSize: "1rem",
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
        fontSize: "1rem",
      }),
      placeholder: (provided) => ({
        ...provided,
        color: isDarkMode ? "#9CA3AF" : "#6B7280", // gray-400 for dark, gray-500 for light
        fontFamily: "inherit",
        marginLeft: 0,
        minWidth: 0,
        fontSize: "1rem",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }),
      option: (provided, state) => ({
        ...provided,
        display: "flex",
        alignItems: "center",
        padding: "8px 12px",
        fontSize: "1rem",
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Administrator";
      case "USER":
        return "User";
      case "AGENT":
        return "Agent";
      default:
        return role;
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Active";
      case "INACTIVE":
        return "Inactive";
      case "SUSPENDED":
        return "Suspended";
      default:
        return status;
    }
  };

  return (
    <div className={`min-h-screen ${className}`}>
      <div className="container mx-auto px-4 py-8 rounded-lg border">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold dark:text-white text-gray-900 mb-2">
              Your Profile
            </h1>
            <p className="dark:text-gray-300 text-gray-600">
              Manage your account settings
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="dark:backdrop-blur-lg dark:bg-white/5 rounded-2xl p-6 shadow-lg dark:border dark:border-white/10 bg-white border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold dark:text-white text-gray-900">
                  Personal Information
                </h2>
                {!isEditing ? (
                  // Only show Edit button for ADMIN
                  profile.role === "ADMIN" && (
                    <Button
                      onClick={onEdit}
                      className="dark:bg-transparent dark:hover:bg-white/10 dark:border dark:border-white/20 dark:text-white bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  )
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={onSave}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      onClick={onCancel}
                      className="dark:bg-transparent dark:hover:bg-white/10 dark:border dark:border-white/20 dark:text-white bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm dark:text-gray-300 text-gray-600 mb-2 flex items-center gap-2">
                      <User className="h-5 w-5 text-purple-400" />
                      First Name
                    </label>
                    <input
                      type="text"
                      value={
                        isEditing
                          ? editedProfile.firstName || ""
                          : profile.firstName
                      }
                      onChange={(e) =>
                        onInputChange("firstName", e.target.value)
                      }
                      className={inputClass(isEditing)}
                      placeholder="Enter first name"
                      readOnly={!isEditing}
                    />
                  </div>
                  <div>
                    <label className="text-sm dark:text-gray-300 text-gray-600 mb-2 flex items-center gap-2">
                      <User className="h-5 w-5 text-purple-400" />
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={
                        isEditing
                          ? editedProfile.lastName || ""
                          : profile.lastName
                      }
                      onChange={(e) =>
                        onInputChange("lastName", e.target.value)
                      }
                      className={inputClass(isEditing)}
                      placeholder="Enter last name"
                      readOnly={!isEditing}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm dark:text-gray-300 text-gray-600 mb-2 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-purple-400" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    className={inputClass(false)}
                    readOnly
                  />
                </div>

                {/* Country Select */}
                <div>
                  <label className="text-sm dark:text-gray-300 text-gray-600 mb-2 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-purple-400" />
                    Country
                  </label>
                  {isEditing ? (
                    <Select
                      value={selectedCountry}
                      onChange={handleCountryChange}
                      options={countryOptions}
                      placeholder={
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <span>Select a country</span>
                        </div>
                      }
                      isDisabled={false}
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
                  ) : (
                    <div className="w-full px-4 py-2 dark:bg-white/5 dark:border dark:border-white/10 dark:text-white bg-gray-50 border border-gray-300 text-gray-900 rounded-lg flex items-center gap-2">
                      {selectedCountry ? (
                        <>
                          <Image
                            src={`https://flagcdn.com/24x18/${selectedCountry.flag}.png`}
                            alt={selectedCountry.label}
                            width={24}
                            height={18}
                            className="w-6 h-4 object-cover"
                          />
                          <span>{selectedCountry.label}</span>
                        </>
                      ) : (
                        <span>{profile.country || "Not specified"}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Phone Input */}
                <div>
                  <label className="text-sm dark:text-gray-300 text-gray-600 mb-2 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-purple-400" />
                    Phone Number
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <div
                        className={`
                          phone-input-wrapper w-full px-4 py-2 rounded-lg border text-base flex items-center
                          border-gray-300 dark:border-gray-600 focus:ring-indigo-500
                          bg-gray-50 dark:bg-white/5 
                          text-gray-900 dark:text-white
                          focus-within:outline-none focus-within:ring-2 focus-within:border-transparent
                        `}
                      >
                        <PhoneInput
                          international
                          countryCallingCodeEditable={false}
                          defaultCountry={
                            selectedCountry?.value as Country | undefined
                          }
                          value={formatPhoneNumber(
                            editedProfile.phoneNumber || ""
                          )}
                          onChange={handlePhoneChange}
                          disabled={false}
                          placeholder=""
                          className="!border-none !bg-transparent !p-0 !m-0 !w-full !text-base"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full px-4 py-2 dark:bg-white/5 dark:border dark:border-white/10 dark:text-white bg-gray-50 border border-gray-300 text-gray-900 rounded-lg">
                      {profile.phoneNumber || "Not specified"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <ProfileSidebar
            profile={profile}
            getRoleDisplayName={getRoleDisplayName}
            getStatusDisplayName={getStatusDisplayName}
            formatDate={formatDate}
          />
        </div>
      </div>
    </div>
  );
};
