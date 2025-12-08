import { FC, useState, useCallback } from "react";
import { ChevronUp, ChevronDown, Edit2, Save, X } from "lucide-react";
import { Lead } from "@/types/leads";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { NameField } from "./NameField";
import { EmailField } from "./EmailField";
import { PhoneField } from "./PhoneField";
import { CountryField } from "./CountryField";

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

  const handleCall = useCallback(
    (phoneNumber: string) => {
      try {
        // Clean the phone number: remove spaces, dashes, parentheses, but keep + sign
        let cleanedNumber = phoneNumber.replace(/[\s\-\(\)\.]/g, "").trim();

        if (!cleanedNumber) {
          toast({
            variant: "destructive",
            description: "Invalid phone number",
          });
          return;
        }

        // Ensure the number starts with + for international format
        if (!cleanedNumber.startsWith("+")) {
          if (cleanedNumber.startsWith("00")) {
            cleanedNumber = "+" + cleanedNumber.substring(2);
          } else if (
            cleanedNumber.startsWith("1") &&
            cleanedNumber.length === 11
          ) {
            cleanedNumber = "+" + cleanedNumber;
          }
        }

        // Try Zoiper protocol first (works with Pro/Biz versions)
        const zoiperUrl = `zoiper://${cleanedNumber}`;

        // Try to open Zoiper with the number
        try {
          const link = document.createElement("a");
          link.href = zoiperUrl;
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();
          setTimeout(() => {
            if (document.body.contains(link)) {
              document.body.removeChild(link);
            }
          }, 100);
        } catch (err) {
          console.error("Error with zoiper:// protocol:", err);
        }

        // For free Zoiper users: Copy to clipboard and show instructions
        // This is a workaround since protocol handling requires Pro/Biz version
        navigator.clipboard
          .writeText(cleanedNumber)
          .then(() => {
            toast({
              title: "Number Copied",
              description: `Phone number copied to clipboard. ${cleanedNumber} - Paste it into Zoiper to dial.`,
              duration: 5000,
            });
          })
          .catch(() => {
            // Fallback if clipboard fails
            toast({
              title: "Manual Dial Required",
              description: `Free Zoiper doesn't support auto-dial. Number: ${cleanedNumber} - Please copy and paste into Zoiper.`,
              duration: 5000,
            });
          });

        console.log("Phone number:", cleanedNumber);
        console.log(
          "Note: Protocol handling (auto-dial) requires Zoiper Pro/Biz version."
        );
        console.log(
          "Free version users need to manually paste the number into Zoiper."
        );
      } catch (error) {
        console.error("Error initiating call:", error);
        toast({
          variant: "destructive",
          title: "Call Failed",
          description:
            "Failed to initiate call. Please copy the number and paste it into Zoiper manually.",
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

  return (
    <div className="overflow-hidden bg-white border border-gray-200 dark:bg-gray-800 rounded-xl dark:border-gray-700">
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
              className="h-8 px-2 transition-opacity duration-200 opacity-0 group-hover:opacity-100"
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
                <NameField
                  firstName={lead.firstName}
                  lastName={lead.lastName}
                  isEditing={true}
                  editedFirstName={editedData.firstName}
                  editedLastName={editedData.lastName}
                  onFirstNameChange={(value) =>
                    setEditedData({ ...editedData, firstName: value })
                  }
                  onLastNameChange={(value) =>
                    setEditedData({ ...editedData, lastName: value })
                  }
                />

                <EmailField
                  email={lead.email}
                  isEditing={true}
                  editedEmail={editedData.email}
                  onEmailChange={(value) =>
                    setEditedData({ ...editedData, email: value })
                  }
                />

                <PhoneField
                  phone={lead.phone}
                  isEditing={true}
                  editedPhone={editedData.phone}
                  onPhoneChange={(value) =>
                    setEditedData({ ...editedData, phone: value })
                  }
                />

                <CountryField
                  country={lead.country}
                  isEditing={true}
                  editedCountry={editedData.country}
                  onCountryChange={(value) =>
                    setEditedData({ ...editedData, country: value })
                  }
                />
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
              <NameField
                firstName={lead.firstName}
                lastName={lead.lastName}
                isEditing={false}
                editedFirstName=""
                editedLastName=""
                onFirstNameChange={() => {}}
                onLastNameChange={() => {}}
                onCopy={(text) => handleCopy(text, "name")}
                copied={copiedField === "name"}
              />

              <EmailField
                email={lead.email}
                isEditing={false}
                editedEmail=""
                onEmailChange={() => {}}
                onCopy={(text) => handleCopy(text, "email")}
                copied={copiedField === "email"}
              />

              <PhoneField
                phone={lead.phone}
                isEditing={false}
                editedPhone=""
                onPhoneChange={() => {}}
                onCopy={(text) => handleCopy(text, "phone")}
                onCall={handleCall}
                copied={copiedField === "phone"}
              />

              <CountryField
                country={lead.country}
                isEditing={false}
                editedCountry=""
                onCountryChange={() => {}}
                onCopy={(text) => handleCopy(text, "country")}
                copied={copiedField === "country"}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactSection;
