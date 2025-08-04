// src/components/dashboardComponents/filters/StatusFilter.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { FilterSelect } from "./FilterSelect";

interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

export const StatusFilter = ({
  value,
  onChange,
  disabled,
}: StatusFilterProps) => {
  // Use React Query to get statuses
  const { data: statuses = [], isLoading: isLoadingStatuses } = useQuery<
    Array<{ id: string; name: string; color?: string }>
  >({
    queryKey: ["statuses"],
    queryFn: async (): Promise<
      Array<{ id: string; name: string; color?: string }>
    > => {
      const response = await fetch("/api/statuses", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch statuses");
      return response.json();
    },
    staleTime: 60 * 60 * 1000, // 1 hour for statuses
    refetchOnWindowFocus: false,
    retry: 2,
    refetchOnMount: false, // Don't refetch if data exists
  });

  const statusNames = statuses.map((status) => status.name);

  // Add "NEW" as a default status if it's not already in the list
  const allStatuses = statusNames.includes("NEW")
    ? statusNames
    : ["NEW", ...statusNames];

  // Create options with proper "all" handling
  const options = [
    { value: "all", label: "All Statuses" }, // Explicitly add "All Statuses" option
    ...allStatuses.map((statusName: string) => ({
      value: statusName,
      label:
        statusName === "NEW"
          ? "New"
          : statusName.charAt(0).toUpperCase() + statusName.slice(1),
    })),
  ];

  // Handle the onChange to ensure proper value mapping
  const handleChange = (selectedValue: string) => {
    console.log("StatusFilter onChange:", {
      selectedValue,
      currentValue: value,
      options: options.map((opt) => ({ value: opt.value, label: opt.label })),
    });

    // Ensure "all" is passed correctly
    onChange(selectedValue === "all" ? "all" : selectedValue);
  };

  // Debug logging
  console.log("StatusFilter render:", {
    value,
    options: options.map((opt) => ({ value: opt.value, label: opt.label })),
    isLoadingStatuses,
  });

  return (
    <FilterSelect
      value={value}
      onChange={handleChange}
      options={options}
      placeholder="All Statuses"
      disabled={disabled}
      isLoading={isLoadingStatuses}
    />
  );
};
