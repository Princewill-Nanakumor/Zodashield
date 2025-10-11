// src/components/dashboardComponents/filters/UserFilter.tsx
"use client";

import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

  // ✅ OPTIMIZATION: Get data from existing cache instead of fetching
  const users = useMemo(() => {
    return queryClient.getQueryData<User[]>(["users"]) || [];
  }, [queryClient]);

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
