"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
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
  isLoading?: boolean;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  filterByUser,
  onFilterChange,
  users,
  isLoading = false,
}) => {
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Debug logging
  console.log("=== FILTER CONTROLS DEBUG ===");
  console.log("Current filterByUser:", filterByUser);
  console.log("Users count:", users.length);
  console.log("Is loading:", isLoading);
  console.log(
    "Available users:",
    users.map((u) => ({ id: u.id, name: `${u.firstName} ${u.lastName}` }))
  );

  // Memoized dropdown users
  const dropdownUsers = users.filter((user) => user.status === "ACTIVE");
  console.log(
    "Active users for dropdown:",
    dropdownUsers.map((u) => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
    }))
  );

  // Helper function to get display value for current filter
  const getDisplayValue = () => {
    console.log("Getting display value for filter:", filterByUser);

    if (filterByUser === FILTER_VALUES.ALL) {
      console.log("Returning 'All Leads'");
      return "All Leads";
    }

    if (filterByUser === FILTER_VALUES.UNASSIGNED) {
      console.log("Returning 'Unassigned Leads'");
      return "Unassigned Leads";
    }

    const user = dropdownUsers.find((u) => u.id === filterByUser);
    if (user) {
      const displayName = `${user.firstName} ${user.lastName}`;
      console.log("Found user, returning:", displayName);
      return displayName;
    }

    console.log("User not found, returning 'Filter by user'");
    return "Filter by user";
  };

  const handleFilterChange = (newFilter: string) => {
    console.log("=== FILTER CHANGE ===");
    console.log("Previous filter:", filterByUser);
    console.log("New filter:", newFilter);
    console.log("Calling onFilterChange with:", newFilter);

    onFilterChange(newFilter);
  };

  return (
    <div className="flex gap-4">
      <Button
        variant="outline"
        onClick={() => setIsStatusModalOpen(true)}
        disabled={isLoading}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Status
      </Button>

      <Select
        value={filterByUser}
        onValueChange={handleFilterChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Filter by user">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : (
              getDisplayValue()
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={FILTER_VALUES.ALL}>All Leads</SelectItem>
          <SelectItem value={FILTER_VALUES.UNASSIGNED}>
            Unassigned Leads
          </SelectItem>
          {!isLoading &&
            dropdownUsers.map((user) => (
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
