import { StylesConfig, GroupBase } from "react-select";
import { SelectOption } from "../authComponents/SelectedCountry";

// Make customStyles a function that takes isDark
export const customStyles = (
  isDark: boolean
): StylesConfig<SelectOption, false, GroupBase<SelectOption>> => ({
  control: (provided, state) => ({
    ...provided,
    minHeight: "40px",
    height: "40px",
    borderRadius: "0.5rem",
    borderColor: state.isFocused ? "#6366f1" : isDark ? "#4b5563" : "#d1d5db",
    borderWidth: "1px",
    boxShadow: state.isFocused ? "0 0 0 1px #6366f1" : "none",
    backgroundColor: isDark
      ? state.isDisabled
        ? "#4b5563"
        : "#374151"
      : state.isDisabled
        ? "#f3f4f6"
        : "#fff",
    color: isDark ? "#fff" : "#111827",
    fontSize: "1rem",
    paddingLeft: "0.75rem",
    width: "100%",
    display: "flex",
    alignItems: "center",
    "&:hover": {
      borderColor: state.isFocused ? "#6366f1" : isDark ? "#4b5563" : "#d1d5db",
    },
  }),
  valueContainer: (provided) => ({
    ...provided,
    minHeight: "40px",
    height: "40px",
    padding: "0 8px",
    display: "flex",
    alignItems: "center",
  }),
  input: (provided) => ({
    ...provided,
    margin: 0,
    padding: 0,
    alignSelf: "center",
  }),
  menu: (provided) => ({
    ...provided,
    zIndex: 9999,
    fontSize: "1rem",
    width: "100%",
    minWidth: "220px",
    marginTop: "4px",
    backgroundColor: isDark ? "#374151" : "#fff",
    color: isDark ? "#fff" : "#111827",
  }),
  menuList: (provided) => ({
    ...provided,
    maxHeight: "180px",
    overflowY: "auto",
    paddingTop: 0,
    paddingBottom: 0,
    backgroundColor: isDark ? "#374151" : "#fff",
  }),
  option: (provided, state) => ({
    ...provided,
    fontSize: "1rem",
    backgroundColor: state.isSelected
      ? "#6366f1"
      : state.isFocused
        ? isDark
          ? "#4b5563"
          : "#f3f4f6"
        : isDark
          ? "#374151"
          : "#fff",
    color: state.isSelected ? "#fff" : isDark ? "#fff" : "#111827",
    padding: "8px 14px",
    cursor: "pointer",
    lineHeight: 1.4,
    wordBreak: "break-word",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: isDark ? "#fff" : "#111827",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: "calc(100% - 40px)",
    margin: 0,
    padding: 0,
    position: "relative",
    transform: "none",
    top: 0,
    left: 0,
  }),
  placeholder: (provided) => ({
    ...provided,
    color: isDark ? "#9ca3af" : "#6b7280",
    fontSize: "1rem",
    margin: 0,
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  dropdownIndicator: (provided) => ({
    ...provided,
    color: isDark ? "#9ca3af" : "#6b7280",
    paddingRight: "0.75rem",
    paddingLeft: "0.5rem",
    svg: {
      width: "18px",
      height: "18px",
    },
  }),
});
