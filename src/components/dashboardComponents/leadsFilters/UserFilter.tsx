// src/components/dashboardComponents/filters/UserFilter.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { User } from "@/types/user.types";
import { FilterSelect } from "./FilterSelect";

interface UserFilterProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}

export const UserFilter = ({ value, onChange, disabled }: UserFilterProps) => {
  // React Query to get users
  const {
    data: users = [],
    isLoading,
    isInitialLoading,
    isFetching,
  } = useQuery<User[]>({
    queryKey: ["users"],
    queryFn: async (): Promise<User[]> => {
      const response = await fetch("/api/users", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    refetchOnMount: false, // Won't refetch when you come back to page
  });

  const dropdownUsers = users.filter((user) => user.status === "ACTIVE");

  const options = [
    { value: "all", label: "All Leads" },
    { value: "unassigned", label: "Unassigned Leads" },
    ...dropdownUsers.map((user) => ({
      value: user.id,
      label: `${user.firstName} ${user.lastName}`,
    })),
  ];

  // Use isInitialLoading to show skeleton on first load
  const showLoading = isLoading || isInitialLoading || isFetching;

  return (
    <FilterSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder="All Leads"
      disabled={disabled}
      isLoading={showLoading}
    />
  );
};
