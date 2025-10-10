// src/app/components/dashboardComponents/EmptyState.tsx
import React from "react";
import { RefreshCw, Users, Globe } from "lucide-react";
import { User } from "@/types/user.types";

interface EmptyStateProps {
  filterByUser: string;
  filterByCountry: string;
  filterByStatus: string;
  filterBySource: string;
  users: User[];
}

const EmptyState: React.FC<EmptyStateProps> = ({
  filterByUser,
  filterByCountry,
  filterByStatus,
  filterBySource,
  users,
}) => {
  const getFilterDescription = () => {
    const filters = [];

    if (filterByUser !== "all") {
      if (filterByUser === "unassigned") {
        filters.push("unassigned leads");
      } else {
        const user = users.find((u) => u.id === filterByUser);
        if (user) {
          filters.push(`leads assigned to ${user.firstName} ${user.lastName}`);
        } else {
          filters.push("leads assigned to selected user");
        }
      }
    }

    if (filterByCountry !== "all") {
      filters.push(`leads from ${filterByCountry}`);
    }

    if (filterByStatus !== "all") {
      filters.push(`leads with status "${filterByStatus}"`);
    }

    if (filterBySource !== "all") {
      filters.push(`leads from source "${filterBySource}"`);
    }

    if (filters.length === 0) {
      return "leads in the system";
    }

    return filters.join(" and ");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const hasAnyFilters =
    filterByUser !== "all" ||
    filterByCountry !== "all" ||
    filterByStatus !== "all";

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
          <Users className="h-6 w-6 text-gray-400" />
        </div>

        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No {getFilterDescription()} found
        </h3>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md">
          {!hasAnyFilters
            ? "There are currently no leads in the system. New leads will appear here once they are added."
            : `No ${getFilterDescription()} match your current filters. Try adjusting your filters or check back later.`}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>

          {hasAnyFilters && (
            <button
              onClick={() => {
                // Reset filters - you'll need to implement this
                window.location.href = window.location.pathname;
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Globe className="h-4 w-4 mr-2" />
              Clear Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
