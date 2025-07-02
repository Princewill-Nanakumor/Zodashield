import { FC, useState, useCallback } from "react";
import {
  Mail,
  Phone,
  ChevronUp,
  ChevronDown,
  Copy,
  Check,
  Globe,
} from "lucide-react";
import { Lead } from "@/types/leads";
import { useToast } from "@/components/ui/use-toast";

interface ContactSectionProps {
  lead: Lead | null;
  isExpanded: boolean;
  onToggle: () => void;
}

export const ContactSection: FC<ContactSectionProps> = ({
  lead,
  isExpanded,
  onToggle,
}) => {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<
    "email" | "phone" | "country" | null
  >(null);

  const handleCopy = useCallback(
    async (text: string, field: "email" | "phone" | "country") => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        toast({
          description: `${
            field === "email"
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

  if (!lead) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={onToggle}
      >
        <h3 className="font-medium text-gray-900 dark:text-gray-100">
          Contact Information
        </h3>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        )}
      </div>
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <div className="flex-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
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
              <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
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
        </div>
      )}
    </div>
  );
};

export default ContactSection;
