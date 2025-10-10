import { FC, useState, useCallback } from "react";
import { Lead } from "@/types/leads";
import {
  User,
  Clock,
  Tag,
  ChevronUp,
  ChevronDown,
  Edit2,
  Save,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface DetailsSectionProps {
  lead: Lead | null;
  isExpanded: boolean;
  onToggle: () => void;
  onLeadUpdated?: (updatedLead: Lead) => Promise<boolean>;
}

export const DetailsSection: FC<DetailsSectionProps> = ({
  lead,
  isExpanded,
  onToggle,
  onLeadUpdated,
}) => {
  const { toast } = useToast();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedSource, setEditedSource] = useState(lead?.source || "");

  const handleEdit = useCallback(() => {
    if (lead) {
      setEditedSource(lead.source || "");
      setIsEditing(true);
    }
  }, [lead]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    if (lead) {
      setEditedSource(lead.source || "");
    }
  }, [lead]);

  const handleSave = useCallback(async () => {
    console.log("💾 DetailsSection handleSave called");

    if (!lead) {
      console.error("❌ No lead available");
      return;
    }

    if (!onLeadUpdated) {
      console.error("❌ No onLeadUpdated callback provided");
      return;
    }

    if (!editedSource.trim()) {
      toast({
        variant: "destructive",
        description: "Source cannot be empty",
      });
      return;
    }

    console.log("✅ Validation passed, preparing to save source...");
    setIsSaving(true);

    try {
      const updatedLead: Lead = {
        ...lead,
        source: editedSource.trim(),
      };

      console.log("📤 Calling onLeadUpdated with source:", editedSource.trim());

      const result = await onLeadUpdated(updatedLead);
      console.log("✅ onLeadUpdated returned:", result);

      if (result) {
        setIsEditing(false);
        toast({
          description: "Source updated successfully",
        });
      } else {
        throw new Error("Update failed - returned false");
      }
    } catch (error) {
      console.error("❌ Error updating source:", error);
      toast({
        variant: "destructive",
        description:
          error instanceof Error ? error.message : "Failed to update source",
      });
    } finally {
      setIsSaving(false);
      console.log("🏁 handleSave completed");
    }
  }, [lead, editedSource, onLeadUpdated, toast]);

  if (!lead) return null;

  // Helper function to get assigned user name
  const getAssignedUserName = () => {
    if (!lead.assignedTo) return "Unassigned";
    if (typeof lead.assignedTo === "string") {
      return "Unassigned";
    }
    if (lead.assignedTo && typeof lead.assignedTo === "object") {
      const assignedTo = lead.assignedTo as {
        firstName?: string;
        lastName?: string;
      };
      if (assignedTo.firstName && assignedTo.lastName) {
        return `${assignedTo.firstName} ${assignedTo.lastName}`;
      }
      if (assignedTo.firstName) return assignedTo.firstName;
      if (assignedTo.lastName) return assignedTo.lastName;
    }
    return "Unknown User";
  };

  // Helper function to format date as DD/MM/YYYY
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer group"
        onClick={onToggle}
      >
        <h3 className="font-medium text-gray-900 dark:text-gray-100">
          Details
        </h3>
        <div className="flex items-center gap-2">
          {isAdmin && isExpanded && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit();
              }}
              className="h-8 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          )}
        </div>
      </div>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4 space-y-3">
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Assigned to
              </p>
              <p>{getAssignedUserName()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Created
              </p>
              <p>{formatDate(lead.createdAt)}</p>
            </div>
          </div>
          {isEditing ? (
            // Edit Mode for Source
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Tag className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-2" />
                <div className="flex-1">
                  <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">
                    Source *
                  </label>
                  <Input
                    value={editedSource}
                    onChange={(e) => setEditedSource(e.target.value)}
                    placeholder="Enter source"
                    className="w-full"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1"
                  size="sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button
                  onClick={handleCancel}
                  disabled={isSaving}
                  variant="outline"
                  className="flex-1"
                  size="sm"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            // View Mode for Source
            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
              <Tag className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Source
                </p>
                <p>{lead.source}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailsSection;
