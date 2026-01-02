// src/components/dashboardComponents/filters/UserFilter.tsx
"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@/types/user.types";
import { MultiSelectFilter } from "./MultiSelectFilter";

interface UserFilterProps {
  value: string[]; // Changed to array
  onChange: (values: string[]) => void; // Changed to array
  disabled: boolean;
  isLoading?: boolean;
}

export const UserFilter = ({
  value = [],
  onChange,
  disabled,
  isLoading = false,
}: UserFilterProps) => {
  // ✅ FIX: Use useQuery to subscribe to cache updates
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await fetch("/api/users", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });

  const options = useMemo(() => {
    const dropdownUsers = users.filter((user) => user.status === "ACTIVE");

    // Create user options and sort alphabetically by name
    const userOptions = dropdownUsers
      .map((user) => ({
        value: user.id,
        label: `${user.firstName} ${user.lastName}`,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return [
      { value: "unassigned", label: "Unassigned Leads" },
      ...userOptions,
    ];
  }, [users]);

  return (
    <MultiSelectFilter
      value={value}
      onChange={onChange}
      options={options}
      placeholder="All Leads"
      disabled={disabled}
      isLoading={isLoading}
    />
  );
};
