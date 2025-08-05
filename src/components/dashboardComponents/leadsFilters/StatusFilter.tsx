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
  // React Query to get statuses
  const {
    data: statuses = [],
    isLoading,
    error,
  } = useQuery<Array<{ id: string; name: string; color?: string }>>({
    queryKey: ["statuses"],
    queryFn: async (): Promise<
      Array<{ id: string; name: string; color?: string }>
    > => {
      console.log("🔍 StatusFilter: Fetching statuses...");
      const response = await fetch("/api/statuses", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch statuses");
      const data = await response.json();
      console.log("🔍 StatusFilter: Received statuses:", data);
      return data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    retry: 2,
    refetchOnMount: false,
  });

  console.log("🔍 StatusFilter render:", {
    statuses,
    isLoading,
    error,
    statusCount: statuses.length,
  });

  const statusNames = statuses.map((status) => status.name);
  const allStatuses = statusNames.includes("NEW")
    ? statusNames
    : ["NEW", ...statusNames];

  const options = [
    { value: "all", label: "All Statuses" },
    ...allStatuses.map((statusName: string) => ({
      value: statusName,
      label:
        statusName.charAt(0).toUpperCase() + statusName.slice(1).toLowerCase(),
    })),
  ];

  console.log("🔍 StatusFilter options:", options);

  return (
    <FilterSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder="All Statuses"
      disabled={disabled}
      isLoading={isLoading}
    />
  );
};
