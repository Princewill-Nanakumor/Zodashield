import Select, {
  components,
  OptionProps,
  SingleValueProps,
  DropdownIndicatorProps,
} from "react-select";

// Type for select option
export type SelectOption = {
  value: string;
  label: string;
};

// Country options
export const countryOptions: SelectOption[] = [
  { value: "US", label: "United States" },
  { value: "NG", label: "Nigeria" },
  // ...add more countries
];

// Custom Option component
export const CustomOption = (props: OptionProps<SelectOption, false>) => (
  <components.Option {...props}>{props.label}</components.Option>
);

// Custom SingleValue component
export const CustomSingleValue = (
  props: SingleValueProps<SelectOption, false>
) => (
  <components.SingleValue {...props}>{props.data.label}</components.SingleValue>
);

// Custom DropdownIndicator component
export const DropdownIndicator = (
  props: DropdownIndicatorProps<SelectOption, false>
) => (
  <components.DropdownIndicator {...props}>
    <span>▼</span>
  </components.DropdownIndicator>
);

export { Select };
