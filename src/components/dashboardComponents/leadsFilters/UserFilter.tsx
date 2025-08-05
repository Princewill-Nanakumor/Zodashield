// src/components/dashboardComponents/filters/UserFilter.tsx
"use client";

import { FilterSelect } from "./FilterSelect";
import { User } from "@/types/user.types";

interface UserFilterProps {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  users?: User[];
}

export const UserFilter = ({
  value,
  onChange,
  disabled,
  users = [],
}: UserFilterProps) => {
  const dropdownUsers = users.filter((user) => user.status === "ACTIVE");

  const options = [
    { value: "all", label: "All Leads" },
    { value: "unassigned", label: "Unassigned Leads" },
    ...dropdownUsers.map((user) => ({
      value: user.id,
      label: `${user.firstName} ${user.lastName}`,
    })),
  ];

  return (
    <FilterSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder="All Leads"
      disabled={disabled}
    />
  );
};
