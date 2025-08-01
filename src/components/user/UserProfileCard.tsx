// src/components/dashboardComponents/UserProfileCard.tsx
"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { ProfileSkeleton } from "./ProfileSkeleton";
import { ProfileContent } from "./ProfileContent";
import { useProfileData } from "@/hooks/useProfileData";

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
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const router = useRouter();

  // Use React Query for profile data
  const { profile, isLoading, error, updateProfile, isUpdating } =
    useProfileData();

  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});

  // Initialize edited profile when profile data is available
  React.useEffect(() => {
    if (profile && !isEditing) {
      setEditedProfile(profile);
    }
  }, [profile, isEditing]);

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

      await updateProfile({ id: profile.id, changes: changedFields });

      setIsEditing(false);

      toast({
        title: "Success",
        description: "Your profile has been updated successfully.",
        variant: "success",
      });

      // Use router.refresh() like your previous code
      setTimeout(() => {
        router.refresh();
      }, 500);
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

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center dark:backdrop-blur-lg dark:bg-white/10 p-8 rounded-xl shadow-lg dark:border dark:border-white/10 bg-white border border-gray-200">
          <p className="dark:text-gray-200 text-gray-800 mb-2">
            Failed to load profile
          </p>
          <p className="text-sm dark:text-gray-300 text-gray-600">
            Email: {session?.user?.email}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
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
      isUpdating={isUpdating}
    />
  );
}
