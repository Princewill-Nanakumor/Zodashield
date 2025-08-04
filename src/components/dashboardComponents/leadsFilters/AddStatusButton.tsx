// src/components/dashboardComponents/filters/AddStatusButton.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import StatusModal from "@/components/dashboardComponents/StatusModal";

interface AddStatusButtonProps {
  disabled: boolean;
}

// Add Status Button Skeleton Component
const AddStatusButtonSkeleton = () => (
  <div className="w-[120px] h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
);

export const AddStatusButton = ({ disabled }: AddStatusButtonProps) => {
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Use React Query to get statuses to determine loading state
  const {
    isLoading: isLoadingStatuses,
    isFetching: isFetchingStatuses,
    isInitialLoading: isInitialLoadingStatuses,
  } = useQuery<Array<{ id: string; name: string; color?: string }>>({
    queryKey: ["statuses"],
    queryFn: async (): Promise<
      Array<{ id: string; name: string; color?: string }>
    > => {
      const response = await fetch("/api/statuses", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch statuses");
      return response.json();
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
    retry: 2,
    refetchOnMount: true,
  });

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

  const handleStatusModalClose = () => {
    setIsStatusModalOpen(false);
    localStorage.removeItem("statusModalOpen");
  };

  // Show skeleton during loading
  if (isLoadingStatuses || isFetchingStatuses || isInitialLoadingStatuses) {
    return <AddStatusButtonSkeleton />;
  }

  return (
    <>
      <button
        onClick={() => setIsStatusModalOpen(true)}
        disabled={disabled}
        className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg
          className="h-4 w-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add Status
      </button>

      <StatusModal
        isOpen={isStatusModalOpen}
        onClose={handleStatusModalClose}
      />
    </>
  );
};
