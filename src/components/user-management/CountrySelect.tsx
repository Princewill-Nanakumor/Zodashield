// src/components/user-management/CountrySelect.tsx
import {
  Select,
  countryOptions,
  CustomOption,
  CustomSingleValue,
  SelectOption,
  DropdownIndicator,
} from "../authComponents/SelectedCountry";
import { CustomPlaceholder } from "../authComponents/GlobeplaceHolder";
import { AlertCircle } from "lucide-react";

interface CountrySelectProps {
  value: SelectOption | null;
  error: string;
  isLoading: boolean;
  onChange: (option: SelectOption | null) => void;
}

export function CountrySelect({
  value,
  error,
  isLoading,
  onChange,
}: CountrySelectProps) {
  return (
    <div>
      <div className="relative flex items-center w-full">
        <div className="w-full">
          <Select
            options={countryOptions}
            styles={{}}
            components={{
              Option: CustomOption,
              SingleValue: CustomSingleValue,
              DropdownIndicator,
              Placeholder: CustomPlaceholder,
            }}
            placeholder="Select Country"
            value={value}
            onChange={onChange}
            isDisabled={isLoading}
            classNamePrefix="react-select"
            menuPlacement="top"
          />
        </div>
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
