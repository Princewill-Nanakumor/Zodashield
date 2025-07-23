"use client";

import { Mail, Phone, Edit, Save, X, User, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
  DropdownIndicator,
  Select,
  countryOptions,
  customStyles,
  CustomOption,
  CustomSingleValue,
  SelectOption,
} from "../authComponents/SelectedCountry";
import { CustomPlaceholder } from "../authComponents/GlobeplaceHolder";
import { useState, useEffect } from "react";
import ProfileSidebar from "./ProfileSidebar";

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
      "w-full px-4 py-2 dark:bg-white/5 dark:border dark:border-white/10 dark:text-white bg-gray-50 border border-gray-300 text-gray-900 rounded-lg",
      editing
        ? "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        : "focus:outline-none",
    ].join(" "),
}) => {
  // For dark mode
  const [isDark, setIsDark] = useState(false);

  // Get initial country from profile or editedProfile
  const initialCountry =
    countryOptions.find(
      (opt) =>
        opt.label === (isEditing ? editedProfile.country : profile.country)
    ) || null;

  // State for phone and country
  const [selectedCountry, setSelectedCountry] = useState<SelectOption | null>(
    initialCountry
  );
  const [phone, setPhone] = useState(
    isEditing
      ? editedProfile.phoneNumber || initialCountry?.phoneCode || ""
      : profile.phoneNumber || initialCountry?.phoneCode || ""
  );

  // Effect to handle dark mode detection
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDark(document.documentElement.classList.contains("dark"));
    }
  }, []);

  // Effect to sync state when switching between edit/view modes
  useEffect(() => {
    const currentCountry =
      countryOptions.find(
        (opt) =>
          opt.label === (isEditing ? editedProfile.country : profile.country)
      ) || null;

    setSelectedCountry(currentCountry);

    // Only update phone if we have a valid value or need to set default country code
    const currentPhone = isEditing
      ? editedProfile.phoneNumber || currentCountry?.phoneCode || ""
      : profile.phoneNumber || currentCountry?.phoneCode || "";

    setPhone(currentPhone);
  }, [
    isEditing,
    editedProfile.country,
    profile.country,
    editedProfile.phoneNumber,
    profile.phoneNumber,
  ]);

  const handleCountryChange = (option: SelectOption | null) => {
    if (!option) return;

    setSelectedCountry(option);
    onInputChange("country", option.label);

    // Only update phone if it's empty or matches previous country code
    if (!phone || phone === selectedCountry?.phoneCode) {
      const newPhone = option.phoneCode;
      setPhone(newPhone);
      onInputChange("phoneNumber", newPhone);
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    onInputChange("phoneNumber", value);
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

  // Calculate phoneInputCountry more reliably
  const phoneInputCountry = selectedCountry?.value?.toLowerCase() || "us";

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
                    onChange={
                      isEditing
                        ? (option) =>
                            handleCountryChange(option as SelectOption)
                        : undefined
                    }
                    isDisabled={!isEditing}
                    classNamePrefix="react-select"
                  />
                </div>

                {/* Phone Input */}
                <div>
                  <label className="text-sm dark:text-gray-300 text-gray-600 mb-2 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-purple-400" />
                    Phone Number
                  </label>
                  <div
                    className={`phone-input-container${isDark ? " dark" : ""} w-full`}
                  >
                    <PhoneInput
                      country={phoneInputCountry}
                      value={phone.trimStart()}
                      countryCodeEditable={false}
                      enableSearch={false}
                      onChange={handlePhoneChange}
                      inputClass={`!pl-4 !h-10 sm:!h-12 !w-full !rounded-lg !text-sm sm:!text-base ${
                        isEditing
                          ? "!border-gray-300 dark:!border-gray-600 focus:!ring-purple-500 focus:!ring-2 focus:!border-purple-500"
                          : "!border-gray-300 dark:!border-gray-600"
                      } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-gray-50 dark:bg-white/5 focus:outline-none transition-colors`}
                      buttonClass="hidden"
                      containerClass="!w-full"
                      placeholder="Phone Number"
                      disableDropdown={true}
                      inputProps={{
                        name: "phoneNumber",
                        required: true,
                        readOnly: !isEditing,
                        disabled: !isEditing,
                      }}
                      disabled={!isEditing}
                    />
                  </div>
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
