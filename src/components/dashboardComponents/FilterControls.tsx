// src/components/dashboardComponents/FilterControls.tsx
"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StatusModal from "@/components/dashboardComponents/StatusModal";
import { User } from "@/types/user.types";

// Constants
const FILTER_VALUES = {
  ALL: "all",
  UNASSIGNED: "unassigned",
} as const;

interface FilterControlsProps {
  filterByUser: string;
  onFilterChange: (newFilter: string) => void;
  users: User[];
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  filterByUser,
  onFilterChange,
  users,
}) => {
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Memoized dropdown users
  const dropdownUsers = users.filter((user) => user.status === "ACTIVE");

  return (
    <div className="flex gap-4">
      <Button variant="outline" onClick={() => setIsStatusModalOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Add Status
      </Button>

      <Select value={filterByUser} onValueChange={onFilterChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Filter by user" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={FILTER_VALUES.ALL}>All Leads</SelectItem>
          <SelectItem value={FILTER_VALUES.UNASSIGNED}>
            Unassigned Leads
          </SelectItem>
          {dropdownUsers.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.firstName} {user.lastName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <StatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
      />
    </div>
  );
};

export default FilterControls;
