import { FC, useState, useCallback } from "react";
import {
  Mail,
  Phone,
  ChevronUp,
  ChevronDown,
  Copy,
  Check,
  Globe,
  User,
  Edit2,
  Save,
  X,
} from "lucide-react";
import { Lead } from "@/types/leads";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ContactSectionProps {
  lead: Lead | null;
  isExpanded: boolean;
  onToggle: () => void;
  onLeadUpdated?: (updatedLead: Lead) => Promise<boolean>;
}

export const ContactSection: FC<ContactSectionProps> = ({
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
  const [copiedField, setCopiedField] = useState<
    "name" | "email" | "phone" | "country" | null
  >(null);

  // Edit form state
  const [editedData, setEditedData] = useState({
    firstName: lead?.firstName || "",
    lastName: lead?.lastName || "",
    email: lead?.email || "",
    phone: lead?.phone || "",
    country: lead?.country || "",
  });

  const handleCopy = useCallback(
    async (text: string, field: "name" | "email" | "phone" | "country") => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        toast({
          description: `${
            field === "name"
              ? "Name"
              : field === "email"
                ? "Email"
                : field === "phone"
                  ? "Phone number"
                  : "Country"
          } copied to clipboard`,
        });
        setTimeout(() => setCopiedField(null), 2000);
      } catch {
        toast({
          variant: "destructive",
          description: "Failed to copy to clipboard",
        });
      }
    },
    [toast]
  );

  const handleEdit = useCallback(() => {
    if (lead) {
      setEditedData({
        firstName: lead.firstName || "",
        lastName: lead.lastName || "",
        email: lead.email || "",
        phone: lead.phone || "",
        country: lead.country || "",
      });
      setIsEditing(true);
    }
  }, [lead]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    if (lead) {
      setEditedData({
        firstName: lead.firstName || "",
        lastName: lead.lastName || "",
        email: lead.email || "",
        phone: lead.phone || "",
        country: lead.country || "",
      });
    }
  }, [lead]);

  const handleSave = useCallback(async () => {
    if (!lead || !onLeadUpdated) {
      return;
    }

    // Validation
    if (!editedData.firstName.trim()) {
      toast({
        variant: "destructive",
        description: "First name is required",
      });
      return;
    }

    if (!editedData.email.trim()) {
      toast({
        variant: "destructive",
        description: "Email is required",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editedData.email)) {
      toast({
        variant: "destructive",
        description: "Please enter a valid email address",
      });
      return;
    }

    setIsSaving(true);

    try {
      const updatedLead: Lead = {
        ...lead,
        firstName: editedData.firstName.trim(),
        lastName: editedData.lastName.trim(),
        email: editedData.email.trim(),
        phone: editedData.phone.trim(),
        country: editedData.country.trim(),
      };

      const result = await onLeadUpdated(updatedLead);

      if (result) {
        setIsEditing(false);
        setTimeout(() => {
          toast({
            description: "Contact information updated successfully",
          });
        }, 100);
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      console.error("Error updating contact info:", error);
      toast({
        variant: "destructive",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update contact information",
      });
    } finally {
      setIsSaving(false);
    }
  }, [lead, editedData, onLeadUpdated, toast]);

  if (!lead) return null;

  // Get the full name
  const fullName = `${lead.firstName} ${lead.lastName}`.trim();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer group"
        onClick={onToggle}
      >
        <h3 className="font-medium text-gray-900 dark:text-gray-100">
          Contact Information
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

      {/* Content with smooth transition */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 pb-4 space-y-3">
          {isEditing ? (
            // Edit Mode
            <>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-2" />
                  <div className="flex-1 space-y-2">
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">
                        First Name *
                      </label>
                      <Input
                        value={editedData.firstName}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData,
                            firstName: e.target.value,
                          })
                        }
                        placeholder="Enter first name"
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">
                        Last Name
                      </label>
                      <Input
                        value={editedData.lastName}
                        onChange={(e) =>
                          setEditedData({
                            ...editedData,
                            lastName: e.target.value,
                          })
                        }
                        placeholder="Enter last name"
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-2" />
                  <div className="flex-1">
                    <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">
                      Email *
                    </label>
                    <Input
                      type="email"
                      value={editedData.email}
                      onChange={(e) =>
                        setEditedData({ ...editedData, email: e.target.value })
                      }
                      placeholder="Enter email"
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-2" />
                  <div className="flex-1">
                    <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">
                      Phone
                    </label>
                    <Input
                      type="tel"
                      value={editedData.phone}
                      onChange={(e) =>
                        setEditedData({ ...editedData, phone: e.target.value })
                      }
                      placeholder="Enter phone number"
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Globe className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-2" />
                  <div className="flex-1">
                    <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">
                      Country
                    </label>
                    <Input
                      value={editedData.country}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          country: e.target.value,
                        })
                      }
                      placeholder="Enter country"
                      className="w-full"
                    />
                  </div>
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
            </>
          ) : (
            // View Mode
            <>
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Name
                  </p>
                  <div className="flex items-center justify-between">
                    <p>{fullName}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(fullName, "name");
                      }}
                      className="ml-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Copy name"
                    >
                      {copiedField === "name" ? (
                        <Check className="w-4 h-4 text-green-500 dark:text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Email
                  </p>
                  <div className="flex items-center justify-between">
                    <p>{lead.email}</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(lead.email, "email");
                      }}
                      className="ml-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Copy email"
                    >
                      {copiedField === "email" ? (
                        <Check className="w-4 h-4 text-green-500 dark:text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Phone
                  </p>
                  <div className="flex items-center justify-between">
                    <p>{lead.phone || "Not provided"}</p>
                    {lead.phone && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(lead.phone!, "phone");
                        }}
                        className="ml-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Copy phone number"
                      >
                        {copiedField === "phone" ? (
                          <Check className="w-4 h-4 text-green-500 dark:text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <Globe className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                <div className="flex-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Country
                  </p>
                  <div className="flex items-center justify-between">
                    <p>{lead.country || "Not provided"}</p>
                    {lead.country && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopy(lead.country!, "country");
                        }}
                        className="ml-2 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Copy country"
                      >
                        {copiedField === "country" ? (
                          <Check className="w-4 h-4 text-green-500 dark:text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactSection;
