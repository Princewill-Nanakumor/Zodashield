"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { ProfileSkeleton } from "./ProfileSkeleton";
import { ProfileContent } from "./ProfileContent";

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

export default function GlassmorphismProfileCard({}: UserProfileCardProps) {
  const { data: session, status, update: updateSession } = useSession();
  const { toast } = useToast();
  const router = useRouter();
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
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }
    } catch (error) {
      console.error("Error fetching profile:", error);

      // Fallback to session data if API fails
      if (session?.user) {
        const sessionProfile: UserProfile = {
          id: session?.user?.id || "temp-id",
          firstName: session?.user?.firstName || "",
          lastName: session?.user?.lastName || "",
          email: session?.user?.email || "",
          phoneNumber: session?.user?.phoneNumber || "",
          country: session?.user?.country || "",
          role: session?.user?.role || "AGENT",
          status: session?.user?.status || "ACTIVE",
          permissions: session?.user?.permissions || [],
          createdBy: "",
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        setProfile(sessionProfile);
        setEditedProfile(sessionProfile);
      } else {
        toast({
          title: "Error loading profile",
          description:
            error instanceof Error ? error.message : "Failed to load profile",
          variant: "destructive",
        });
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

  // Function to check if any changes were made
  const hasChanges = (): boolean => {
    if (!profile) return false;

    const editableFields: (keyof UserProfile)[] = [
      "firstName",
      "lastName",
      "phoneNumber",
      "country",
    ];

    return editableFields.some((field) => {
      const originalValue = profile[field] || "";
      const editedValue = editedProfile[field] || "";
      return originalValue !== editedValue;
    });
  };

  const handleSave = async () => {
    if (!profile) {
      toast({
        title: "Error",
        description: "No profile data available to update.",
        variant: "destructive",
      });
      return;
    }

    // Check if we have a valid ID (not a temporary one)
    if (!profile.id || profile.id === "temp-id" || profile.id === "") {
      toast({
        title: "Cannot update profile",
        description:
          "Profile ID is not available. Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }

    // Check if any changes were actually made
    if (!hasChanges()) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      // Only send the fields that were actually changed
      const changedFields: {
        firstName?: string;
        lastName?: string;
        phoneNumber?: string;
        country?: string;
      } = {};

      const editableFields = [
        "firstName",
        "lastName",
        "phoneNumber",
        "country",
      ] as const;

      editableFields.forEach((field) => {
        const originalValue = profile[field] || "";
        const editedValue = editedProfile[field] || "";
        if (originalValue !== editedValue) {
          changedFields[field] = editedValue;
        }
      });

      const response = await fetch(`/api/users/${profile.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(changedFields),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            errorData.message ||
            `HTTP error! status: ${response.status}`
        );
      }

      const updatedProfile = await response.json();

      // Update local state immediately
      setProfile(updatedProfile);
      setEditedProfile(updatedProfile);
      setIsEditing(false);

      // Update session using your previous pattern
      const result = await updateSession({
        ...session,
        user: {
          ...session?.user,
          firstName: updatedProfile.firstName,
          lastName: updatedProfile.lastName,
          phoneNumber: updatedProfile.phoneNumber,
          country: updatedProfile.country,
          role: updatedProfile.role,
          status: updatedProfile.status,
          permissions: updatedProfile.permissions,
        },
      });

      if (result) {
        toast({
          title: "Success",
          description: "Your profile has been updated successfully.",
          variant: "success",
        });

        // Use router.refresh() like your previous code
        setTimeout(() => {
          router.refresh();
        }, 500);
      } else {
        throw new Error("Failed to update session");
      }
    } catch (error) {
      console.error("Error updating profile:", error);

      toast({
        title: "Update failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update profile. Please try again.",
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
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center dark:backdrop-blur-lg dark:bg-white/10 p-8 rounded-xl shadow-lg dark:border dark:border-white/10 bg-white border border-gray-200">
          <p className="dark:text-gray-200 text-gray-800 mb-2">
            Please sign in to view your profile
          </p>
        </div>
      </div>
    );
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
          <button
            onClick={fetchProfile}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ProfileContent
      profile={profile}
      isEditing={isEditing}
      editedProfile={editedProfile}
      onEdit={handleEdit}
      onSave={handleSave}
      onCancel={handleCancel}
      onInputChange={handleInputChange}
    />
  );
}
