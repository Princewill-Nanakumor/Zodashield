import { FC } from "react";
import { Phone, PhoneCall, Copy, Check, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { maskPhoneNumber } from "@/utils/phoneMask";

interface PhoneFieldProps {
  phone: string | null | undefined;
  isEditing: boolean;
  editedPhone: string;
  onPhoneChange: (value: string) => void;
  onCopy?: (text: string) => void;
  onCall?: (phoneNumber: string) => void;
  copied?: boolean;
  canViewPhoneNumbers?: boolean; // Whether user can see full phone number
}

export const PhoneField: FC<PhoneFieldProps> = ({
  phone,
  isEditing,
  editedPhone,
  onPhoneChange,
  onCopy,
  onCall,
  copied = false,
  canViewPhoneNumbers = false,
}) => {
  if (isEditing) {
    return (
      <div className="flex items-start gap-3">
        <Phone className="w-5 h-5 mt-2 text-gray-400 dark:text-gray-500" />
        <div className="flex-1">
          <label className="block mb-1 text-sm text-gray-500 dark:text-gray-400">
            Phone
          </label>
          <Input
            type="tel"
            value={editedPhone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="Enter phone number"
            className="w-full"
          />
        </div>
      </div>
    );
  }

  // Determine what to display
  const displayPhone = canViewPhoneNumbers
    ? phone || "Not provided"
    : phone
      ? maskPhoneNumber(phone)
      : "Not provided";

  const isMasked = !canViewPhoneNumbers && phone;

  return (
    <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
      <Phone className="w-5 h-5 text-gray-400 dark:text-gray-500" />
      <div className="flex-1">
        <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p>{displayPhone}</p>
            {isMasked && (
              <EyeOff className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            )}
          </div>
          {phone && canViewPhoneNumbers && (
            <div className="flex items-center gap-1 ml-2">
              {onCall && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCall(phone);
                  }}
                  className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors text-blue-600 dark:text-blue-400"
                  title="Call with Zoiper"
                >
                  <PhoneCall className="w-4 h-4" />
                </button>
              )}
              {onCopy && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopy(phone);
                  }}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Copy phone number"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500 dark:text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

