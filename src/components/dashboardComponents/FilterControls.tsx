// src/components/dashboardComponents/FilterControls.tsx
"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  // Memoized dropdown users
  const dropdownUsers = users.filter((user) => user.status === "ACTIVE");

  // Listen for custom event to open modal after page refresh
  useEffect(() => {
    const handleOpenStatusModal = () => {
      setIsStatusModalOpen(true);
    };

    window.addEventListener("openStatusModal", handleOpenStatusModal);

    // Check if modal should be open on initial load
    const shouldOpenModal = localStorage.getItem("statusModalOpen");
    if (shouldOpenModal === "true") {
      setIsStatusModalOpen(true);
    }

    return () => {
      window.removeEventListener("openStatusModal", handleOpenStatusModal);
    };
  }, []);

  const handleFilterChange = (newFilter: string) => {
    onFilterChange(newFilter);
  };

  const handleStatusModalClose = () => {
    setIsStatusModalOpen(false);
    localStorage.removeItem("statusModalOpen");
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

      {/* Replaced Radix UI Select with simple HTML select */}
      <div className="relative">
        <select
          value={filterByUser}
          onChange={(e) => handleFilterChange(e.target.value)}
          disabled={isLoading}
          className="w-[200px] h-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {isLoading ? (
            <option value="" disabled>
              Loading...
            </option>
          ) : (
            <>
              <option value={FILTER_VALUES.ALL}>All Leads</option>
              <option value={FILTER_VALUES.UNASSIGNED}>Unassigned Leads</option>
              {dropdownUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </option>
              ))}
            </>
          )}
        </select>

        {/* Loading spinner overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800 rounded-md">
            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
          </div>
        )}
      </div>

      <StatusModal
        isOpen={isStatusModalOpen}
        onClose={handleStatusModalClose}
      />
    </div>
  );
};

export default FilterControls;
