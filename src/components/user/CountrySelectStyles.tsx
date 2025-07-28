import { StylesConfig } from "react-select";

export interface SelectOption {
  value: string;
  label: string;
  flag: string;
  phoneCode: string;
}

export const getCountrySelectStyles = (): StylesConfig<SelectOption, false> => {
  const isDarkMode =
    typeof window !== "undefined" &&
    document.documentElement.classList.contains("dark");

  return {
    container: (provided) => ({
      ...provided,
      width: "100%",
      minWidth: 0,
    }),
    control: (base, state) => ({
      ...base,
      minHeight: "42px",
      height: "42px",
      borderRadius: "0.5rem",
      borderWidth: "1px",
      borderStyle: "solid",
      borderColor: state.isFocused
        ? "#6366F1" // indigo-500
        : isDarkMode
          ? "#4B5563"
          : "#D1D5DB", // gray-600 for dark, gray-300 for light
      backgroundColor: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#F9FAFB", // dark:bg-white/5 or gray-50
      color: isDarkMode ? "#F3F4F6" : "#111827", // gray-100 for dark, gray-900 for light
      fontSize: "1rem",
      fontFamily: "inherit",
      outline: "none",
      width: "100%",
      cursor: "pointer",
      transition: "none",
      boxShadow: state.isFocused
        ? "0 0 0 1px #6366F1" // indigo focus ring when focused
        : "none",
      "&:hover": {
        borderColor: state.isFocused
          ? "#6366F1"
          : isDarkMode
            ? "#4B5563"
            : "#D1D5DB",
      },
    }),
    valueContainer: (provided) => ({
      ...provided,
      height: "42px",
      padding: "0 0.75rem",
      display: "flex",
      alignItems: "center",
      minWidth: 0,
    }),
    singleValue: (provided) => ({
      ...provided,
      display: "flex",
      alignItems: "center",
      gap: "8px",
      fontSize: "1rem",
      fontFamily: "inherit",
      color: isDarkMode ? "#F3F4F6" : "#111827", // gray-100 for dark, gray-900 for light
      marginLeft: 0,
      minWidth: 0,
      maxWidth: "100%",
    }),
    input: (provided) => ({
      ...provided,
      margin: 0,
      padding: 0,
      fontFamily: "inherit",
      color: isDarkMode ? "#F3F4F6" : "#111827", // gray-100 for dark, gray-900 for light
      minWidth: 0,
      fontSize: "1rem",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: isDarkMode ? "#9CA3AF" : "#6B7280", // gray-400 for dark, gray-500 for light
      fontFamily: "inherit",
      marginLeft: 0,
      minWidth: 0,
      fontSize: "1rem",
      display: "flex",
      alignItems: "center",
      gap: "8px",
    }),
    option: (provided, state) => ({
      ...provided,
      display: "flex",
      alignItems: "center",
      padding: "8px 12px",
      fontSize: "1rem",
      fontFamily: "inherit",
      backgroundColor: state.isSelected
        ? isDarkMode
          ? "#312E81"
          : "#EEF2FF" // indigo-900 for dark, indigo-50 for light
        : state.isFocused
          ? isDarkMode
            ? "#374151"
            : "#F3F4F6" // gray-700 for dark, gray-100 for light
          : isDarkMode
            ? "#1F2937"
            : "#FFFFFF", // gray-800 for dark, white for light
      color: isDarkMode ? "#F3F4F6" : "#111827", // gray-100 for dark, gray-900 for light
      cursor: state.isDisabled ? "not-allowed" : "pointer",
      opacity: state.isDisabled ? 0.5 : 1,
      "&:active": {
        backgroundColor: isDarkMode ? "#312E81" : "#EEF2FF",
      },
    }),
    menu: (provided) => ({
      ...provided,
      fontFamily: "inherit",
      backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF", // gray-800 for dark, white for light
      color: isDarkMode ? "#F3F4F6" : "#111827", // gray-100 for dark, gray-900 for light
      borderRadius: "0.5rem",
      border: isDarkMode ? "1px solid #374151" : "1px solid #E5E7EB", // gray-700 for dark, gray-200 for light
      boxShadow: isDarkMode
        ? "0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)"
        : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      marginTop: "4px",
      zIndex: 9999,
      minWidth: 0,
    }),
    menuList: (provided) => ({
      ...provided,
      padding: "2px",
      maxHeight: "120px",
      minWidth: 0,
      "::-webkit-scrollbar": {
        width: "6px",
      },
      "::-webkit-scrollbar-track": {
        background: isDarkMode ? "#374151" : "#F3F4F6",
        borderRadius: "3px",
      },
      "::-webkit-scrollbar-thumb": {
        background: isDarkMode ? "#818CF8" : "#9CA3AF",
        borderRadius: "3px",
      },
    }),
    dropdownIndicator: (provided) => ({
      ...provided,
      padding: "0 8px",
      color: isDarkMode ? "#9CA3AF" : "#6B7280", // gray-400 for dark, gray-500 for light
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
  };
};
