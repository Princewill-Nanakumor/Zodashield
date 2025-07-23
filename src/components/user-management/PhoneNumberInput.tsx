// src/components/user-management/PhoneNumberInput.tsx
import { Phone, AlertCircle } from "lucide-react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

interface PhoneNumberInputProps {
  value: string;
  error: string;
  isLoading: boolean;
  country: string;
  onChange: (value: string) => void;
}

export function PhoneNumberInput({
  value,
  error,
  isLoading,
  country,
  onChange,
}: PhoneNumberInputProps) {
  return (
    <div>
      <div className="relative flex items-center w-full">
        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
        <PhoneInput
          country={country}
          value={value}
          onChange={onChange}
          inputClass={`!pl-10 !h-10 !w-full !rounded-lg !text-sm !border ${
            error
              ? "!border-red-500 focus:!border-red-500 focus:!ring-red-500 focus:!ring-2"
              : "!border-gray-300 dark:!border-gray-600 focus:!ring-indigo-500 focus:!ring-2"
          } placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:border-transparent transition-colors`}
          buttonClass="hidden"
          containerClass="!w-full"
          disabled={isLoading}
          placeholder="Phone Number"
          disableDropdown={true}
          inputProps={{
            name: "phoneNumber",
            required: true,
          }}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
