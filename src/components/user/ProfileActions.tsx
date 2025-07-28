"use client";

import { Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface ProfileActionsProps {
  profile: UserProfile;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export const ProfileActions: React.FC<ProfileActionsProps> = ({
  profile,
  isEditing,
  onEdit,
  onSave,
  onCancel,
}) => {
  return (
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
  );
};
