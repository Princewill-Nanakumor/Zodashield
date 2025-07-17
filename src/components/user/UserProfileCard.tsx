"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Phone,
  Shield,
  Edit,
  Save,
  X,
  User,
  Calendar,
  Lock,
  MapPin,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ProfileSkeleton } from "./ProfileSkeleton";

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

interface UserProfileCardProps {
  className?: string;
}

export default function GlassmorphismProfileCard({
  className = "",
}: UserProfileCardProps) {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/users/me", {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const userProfile = await response.json();
        setProfile(userProfile);
        setEditedProfile(userProfile);
      } else {
        const usersResponse = await fetch("/api/users", {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (usersResponse.ok) {
          const users = await usersResponse.json();
          const currentUser = Array.isArray(users)
            ? users.find(
                (user: UserProfile) => user.email === session?.user?.email
              )
            : null;

          if (currentUser) {
            setProfile(currentUser);
            setEditedProfile(currentUser);
          } else {
            const sessionProfile: UserProfile = {
              id: session?.user?.id || "",
              firstName: session?.user?.firstName || "",
              lastName: session?.user?.lastName || "",
              email: session?.user?.email || "",
              phoneNumber: "",
              country: "",
              role: session?.user?.role || "USER",
              status: "ACTIVE",
              permissions: session?.user?.permissions || [],
              createdBy: "",
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
            };
            setProfile(sessionProfile);
            setEditedProfile(sessionProfile);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      if (session?.user) {
        const sessionProfile: UserProfile = {
          id: session?.user?.id || "",
          firstName: session?.user?.firstName || "",
          lastName: session?.user?.lastName || "",
          email: session?.user?.email || "",
          phoneNumber: "",
          country: "",
          role: session?.user?.role || "USER",
          status: "ACTIVE",
          permissions: session?.user?.permissions || [],
          createdBy: "",
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        setProfile(sessionProfile);
        setEditedProfile(sessionProfile);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile(profile || {});
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedProfile(profile || {});
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${profile.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editedProfile),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      setEditedProfile(updatedProfile);
      setIsEditing(false);

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setEditedProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (status === "loading" || isLoading) {
    return <ProfileSkeleton />;
  }

  if (!session) {
    return null;
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center dark:backdrop-blur-lg dark:bg-white/10 p-8 rounded-xl shadow-lg dark:border dark:border-white/10 bg-white border border-gray-200">
          <p className="dark:text-gray-200 text-gray-800 mb-2">
            Profile not found
          </p>
          <p className="text-sm dark:text-gray-300 text-gray-600">
            Email: {session?.user?.email}
          </p>
        </div>
      </div>
    );
  }

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

  // Helper for input classes
  const inputClass = (editing: boolean) =>
    [
      "w-full px-4 py-2 dark:bg-white/5 dark:border dark:border-white/10 dark:text-white bg-gray-50 border border-gray-300 text-gray-900 rounded-lg",
      editing
        ? "focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        : "focus:outline-none",
    ].join(" ");

  return (
    <div className={`min-h-screen ${className}`}>
      <div className="container mx-auto px-4 py-8 rounded-lg border">
        {/* Header */}
        <div className="flex flex-col md:flex-row  items-start md:items-center mb-8">
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
                  <Button
                    onClick={handleEdit}
                    className="dark:bg-transparent dark:hover:bg-white/10 dark:border dark:border-white/20 dark:text-white bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSave}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                    <Button
                      onClick={handleCancel}
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
                        handleInputChange("firstName", e.target.value)
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
                        handleInputChange("lastName", e.target.value)
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

                {/* Phone */}
                <div>
                  <label className="text-sm dark:text-gray-300 text-gray-600 mb-2 flex items-center gap-2">
                    <Phone className="h-5 w-5 text-purple-400" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={
                      isEditing
                        ? editedProfile.phoneNumber || ""
                        : profile.phoneNumber || ""
                    }
                    onChange={(e) =>
                      handleInputChange("phoneNumber", e.target.value)
                    }
                    className={inputClass(isEditing)}
                    placeholder="Enter phone number"
                    readOnly={!isEditing}
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="text-sm dark:text-gray-300 text-gray-600 mb-2 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-purple-400" />
                    Country
                  </label>
                  <input
                    type="text"
                    value={
                      isEditing
                        ? editedProfile.country || ""
                        : profile.country || ""
                    }
                    onChange={(e) =>
                      handleInputChange("country", e.target.value)
                    }
                    className={inputClass(isEditing)}
                    placeholder="Enter country"
                    readOnly={!isEditing}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Account Info */}
            <div className="dark:backdrop-blur-lg dark:bg-white/5 rounded-2xl p-6 shadow-lg dark:border dark:border-white/10 bg-white border border-gray-200">
              <h3 className="text-xl font-semibold dark:text-white text-gray-900 mb-6">
                Account Information
              </h3>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/10 rounded-lg">
                    <User className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm dark:text-gray-300 text-gray-600">
                      Role
                    </p>
                    <p className="dark:text-white text-gray-900 font-medium">
                      {getRoleDisplayName(profile.role)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <Lock className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm dark:text-gray-300 text-gray-600">
                      Status
                    </p>
                    <p
                      className={`font-medium ${
                        profile.status === "ACTIVE"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {getStatusDisplayName(profile.status)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm dark:text-gray-300 text-gray-600">
                      Member Since
                    </p>
                    <p className="dark:text-white text-gray-900 font-medium">
                      {formatDate(profile.createdAt)}
                    </p>
                  </div>
                </div>

                {profile.lastLogin && (
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-500/10 rounded-lg">
                      <Calendar className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm dark:text-gray-300 text-gray-600">
                        Last Login
                      </p>
                      <p className="dark:text-white text-gray-900 font-medium">
                        {formatDate(profile.lastLogin)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Permissions */}
            <div className="dark:backdrop-blur-lg dark:bg-white/5 rounded-2xl p-6 shadow-lg dark:border dark:border-white/10 bg-white border border-gray-200">
              <h3 className="text-xl font-semibold dark:text-white text-gray-900 mb-6">
                Permissions
              </h3>
              <div className="space-y-6">
                {profile.permissions && profile.permissions.length > 0 ? (
                  profile.permissions.map((permission, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="p-3 bg-green-500/10 rounded-lg">
                        <Shield className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm dark:text-gray-300 text-gray-600">
                          Permission
                        </p>
                        <p className="dark:text-white text-gray-900 font-medium">
                          {permission}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-500/10 rounded-lg">
                      <Shield className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm dark:text-gray-300 text-gray-600">
                        Permission
                      </p>
                      <p className="dark:text-gray-400 text-gray-500 font-medium">
                        No specific permissions assigned
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
