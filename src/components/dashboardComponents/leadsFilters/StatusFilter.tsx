// src/components/dashboardComponents/filters/StatusFilter.tsx
"use client";

import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FilterSelect } from "./FilterSelect";

interface StatusFilterProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  isLoading?: boolean;
}

export const StatusFilter = ({
  value,
  onChange,
  disabled,
  isLoading = false,
}: StatusFilterProps) => {
  const queryClient = useQueryClient();

  // ✅ OPTIMIZATION: Get data from existing cache instead of fetching
  const statuses = useMemo(() => {
    return (
      queryClient.getQueryData<
        Array<{ id: string; name: string; color?: string }>
      >(["statuses"]) || []
    );
  }, [queryClient]);

  const options = useMemo(() => {
    const statusNames = statuses.map((status) => status.name);
    const allStatuses = statusNames.includes("NEW")
      ? statusNames
      : ["NEW", ...statusNames];

    return [
      { value: "all", label: "All Statuses" },
      ...allStatuses.map((statusName: string) => ({
        value: statusName,
        label:
          statusName.charAt(0).toUpperCase() +
          statusName.slice(1).toLowerCase(),
      })),
    ];
  }, [statuses]);

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
