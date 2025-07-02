// src/components/dashboardComponents/EmptyState.tsx
"use client";

interface EmptyStateProps {
  filterByUser: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ filterByUser }) => {
  const getMessage = () => {
    if (filterByUser === "unassigned") {
      return "No unassigned leads available.";
    } else if (filterByUser !== "all") {
      return "No leads assigned to this user.";
    } else {
      return "No leads available at the moment.";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No leads found
      </h3>
      <p className="text-gray-500 dark:text-gray-400">{getMessage()}</p>
    </div>
  );
};

export default EmptyState;
