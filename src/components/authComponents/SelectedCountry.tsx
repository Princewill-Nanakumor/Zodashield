// src/components/authComponents/SelectedCountry.ts

import Select, {
  StylesConfig,
  OptionProps,
  components,
  DropdownIndicatorProps,
} from "react-select";
import Image from "next/image";
import { countryOptions } from "./CountryData";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export interface SelectOption {
  value: string;
  label: string;
  flag: string;
  phoneCode: string;
}

export type { StylesConfig, OptionProps };

// Helper to detect dark mode
const isDark = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

export const customStyles: StylesConfig<SelectOption, false> = {
  control: (provided, state) => {
    const dark = isDark();
    return {
      ...provided,
      appearance: "none",
      borderRadius: "0.5rem",
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: state.isFocused
        ? "transparent"
        : dark
          ? "#374151" // dark:border-gray-600
          : "#D1D5DB", // border-gray-300
      backgroundColor: dark ? "#374151" : "white", // dark:bg-gray-700
      color: dark ? "#F3F4F6" : "#111827", // dark:text-gray-100
      paddingLeft: "0.75rem",
      paddingRight: "0.75rem",
      paddingTop: "0.5rem",
      paddingBottom: "0.5rem",
      fontSize: "0.875rem",
      boxShadow: state.isFocused
        ? dark
          ? "0 0 0 2px #818CF8"
          : "0 0 0 2px #6366F1"
        : "none",
      outline: "none",
      minHeight: "auto",
      width: "100%",
      cursor: "pointer",
      fontFamily: inter.style.fontFamily,
      "&:hover": {
        borderColor: state.isFocused
          ? "transparent"
          : dark
            ? "#374151"
            : "#D1D5DB",
      },
      transition: "box-shadow 0.2s ease",
    };
  },
  option: (provided, state) => {
    const dark = isDark();
    return {
      ...provided,
      display: "flex",
      alignItems: "center",
      padding: "8px 12px",
      fontSize: "0.875rem",
      fontFamily: inter.style.fontFamily,
      backgroundColor: state.isSelected
        ? dark
          ? "#312E81" // dark:bg-indigo-900
          : "#EEF2FF" // bg-blue-50
        : state.isFocused
          ? dark
            ? "#1F2937" // dark:bg-gray-800
            : "#F3F4F6" // bg-gray-50
          : dark
            ? "#374151"
            : "white",
      color: dark ? "#F3F4F6" : "#111827",
      cursor: state.isDisabled ? "not-allowed" : "pointer",
      opacity: state.isDisabled ? 0.5 : 1,
      "&:hover": {
        backgroundColor: dark ? "#1F2937" : "#F3F4F6",
      },
    };
  },
  singleValue: (provided) => {
    const dark = isDark();
    return {
      ...provided,
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "0.875rem",
      marginLeft: "0",
      fontFamily: inter.style.fontFamily,
      color: dark ? "#F3F4F6" : "#111827",
    };
  },
  input: (provided) => {
    const dark = isDark();
    return {
      ...provided,
      marginLeft: "0.5rem",
      padding: 0,
      fontFamily: inter.style.fontFamily,
      color: dark ? "#F3F4F6" : "#111827",
    };
  },
  placeholder: (provided) => {
    const dark = isDark();
    return {
      ...provided,
      marginLeft: "0.5rem",
      color: dark ? "#9CA3AF" : "#6B7280", // dark:text-gray-400
      fontFamily: inter.style.fontFamily,
    };
  },
  dropdownIndicator: (provided) => ({
    ...provided,
    padding: "0 4px",
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  valueContainer: (provided) => ({
    ...provided,
    overflow: "hidden",
    padding: 0,
    paddingLeft: 0,
    display: "flex",
    alignItems: "center",
  }),
  menu: (provided) => {
    const dark = isDark();
    return {
      ...provided,
      fontFamily: inter.style.fontFamily,
      backgroundColor: dark ? "#374151" : "white",
      color: dark ? "#F3F4F6" : "#111827",
      // Fix for mobile layout shift
      position: "fixed" as const,
      top: "auto",
      left: "auto",
      right: "auto",
      bottom: "auto",
      width: "100%",
      maxWidth: "100vw",
      zIndex: 9999,
      // Ensure menu doesn't cause horizontal scroll
      maxHeight: "200px",
      overflow: "auto",
    };
  },
  menuList: (provided) => ({
    ...provided,
    // Prevent horizontal scroll
    maxHeight: "200px",
    overflow: "auto",
  }),
};

export const CustomOption = ({
  data,
  innerProps,
  isDisabled,
  isFocused,
  isSelected,
}: OptionProps<SelectOption, false>) => (
  <div
    {...innerProps}
    className={`flex items-center gap-3 p-2 cursor-pointer ${inter.className} ${
      isDisabled
        ? "opacity-50 cursor-not-allowed"
        : isSelected
          ? "bg-blue-50 dark:bg-indigo-900"
          : isFocused
            ? "bg-gray-50 dark:bg-gray-800"
            : "bg-white dark:bg-gray-700"
    } hover:bg-gray-100 dark:hover:bg-gray-800`}
  >
    <Image
      src={`https://flagcdn.com/24x18/${data.flag}.png`}
      alt={data.label}
      width={24}
      height={18}
      className="w-6 h-4 object-cover"
    />
    <span className="flex-1">{data.label}</span>
    <span className="text-gray-500 dark:text-gray-400 text-sm">
      {data.phoneCode}
    </span>
  </div>
);

export const CustomSingleValue = ({ data }: { data: SelectOption }) => (
  <div className="flex items-center gap-2 h-full">
    <Image
      src={`https://flagcdn.com/24x18/${data.flag}.png`}
      alt={data.label}
      width={24}
      height={18}
      className="w-6 h-4 object-cover flex-shrink-0"
    />
    <span className={`truncate flex-1 ${inter.className}`}>{data.label}</span>
  </div>
);

export const DropdownIndicator = (
  props: DropdownIndicatorProps<SelectOption, false>
) => (
  <components.DropdownIndicator {...props}>
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.18179 6.18181C4.35753 6.00608 4.64245 6.00608 4.81819 6.18181L7.49999 8.86362L10.1818 6.18181C10.3575 6.00608 10.6424 6.00608 10.8182 6.18181C10.9939 6.35755 10.9939 6.64247 10.8182 6.81821L7.81819 9.81821C7.64245 9.99394 7.35753 9.99394 7.18179 9.81821C4.00605 6.64247 4.00605 6.35755 4.18179 6.18181Z"
        fill="currentColor"
        fillRule="evenodd"
        clipRule="evenodd"
      ></path>
    </svg>
  </components.DropdownIndicator>
);

export { Select, countryOptions };
