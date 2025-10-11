// src/components/dashboardComponents/filters/UserFilter.tsx
"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@/types/user.types";
import { FilterSelect } from "./FilterSelect";

interface UserFilterProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  isLoading?: boolean;
}

export const UserFilter = ({
  value,
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

    return [
      { value: "all", label: "All Leads" },
      { value: "unassigned", label: "Unassigned Leads" },
      ...dropdownUsers.map((user) => ({
        value: user.id,
        label: `${user.firstName} ${user.lastName}`,
      })),
    ];
  }, [users]);

  return (
    <FilterSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder="All Leads"
      disabled={disabled}
      isLoading={isLoading}
    />
  );
};
