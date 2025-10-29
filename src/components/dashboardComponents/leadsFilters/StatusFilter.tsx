// src/components/dashboardComponents/filters/StatusFilter.tsx
"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
  // ✅ FIX: Use useQuery to subscribe to cache updates
  const { data: statuses = [] } = useQuery<
    Array<{ id: string; name: string; color?: string }>
  >({
    queryKey: ["statuses"],
    queryFn: async () => {
      const response = await fetch("/api/statuses", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch statuses");
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });

  const options = useMemo(() => {
    return [
      { value: "all", label: "All Statuses" },
      ...statuses.map((status) => ({
        value: status.id,
        label:
          status.name.charAt(0).toUpperCase() +
          status.name.slice(1).toLowerCase(),
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
