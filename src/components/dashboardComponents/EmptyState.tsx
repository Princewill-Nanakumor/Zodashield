// src/components/dashboardComponents/EmptyState.tsx
"use client";

interface EmptyStateProps {
  filterByUser: string;
  filterByCountry?: string;
  users?: Array<{ id: string; firstName: string; lastName: string }>;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  filterByUser,
  filterByCountry = "all",
  users = [],
}) => {
  const getUserDisplayName = (userId: string) => {
    if (userId === "all") return "all users";
    if (userId === "unassigned") return "unassigned leads";

    const user = users.find((u) => u.id === userId);
    if (user) {
      return `${user.firstName} ${user.lastName}`;
    }

    return `user (${userId.slice(0, 8)}...)`;
  };

  const getCountryDisplayName = (country: string) => {
    if (country === "all") return "all countries";
    return country.charAt(0).toUpperCase() + country.slice(1);
  };

  const getEmptyMessage = () => {
    const filters = [];

    if (filterByUser !== "all") {
      const userDisplay = getUserDisplayName(filterByUser);
      filters.push(`user filter "${userDisplay}"`);
    }

    if (filterByCountry !== "all") {
      const countryDisplay = getCountryDisplayName(filterByCountry);
      filters.push(`country filter "${countryDisplay}"`);
    }

    if (filters.length === 0) {
      return "No leads found in the system.";
    }

    if (filters.length === 1) {
      return `No leads found with ${filters[0]}.`;
    }

    return `No leads found with ${filters.slice(0, -1).join(", ")} and ${filters[filters.length - 1]}.`;
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg
            className="h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          No leads found
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {getEmptyMessage()}
        </p>
        <div className="mt-6">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
