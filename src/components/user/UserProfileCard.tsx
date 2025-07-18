"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
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
