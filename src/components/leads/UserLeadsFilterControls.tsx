"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserLeadsFilterControlsProps {
  shouldShowLoading: boolean;
  filterByCountry: string;
  onCountryFilterChange: (country: string) => void;
  availableCountries: string[];
  counts: {
    currentPage: number;
    filtered: number;
    total: number;
  };
}

export const UserLeadsFilterControls: React.FC<
  UserLeadsFilterControlsProps
> = ({
  shouldShowLoading,
  filterByCountry,
  onCountryFilterChange,
  availableCountries,
  counts,
}) => {
  if (shouldShowLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="w-[180px] h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
          </div>
          <div className="w-48 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter by Country:
          </label>
          <Select
            value={filterByCountry}
            onValueChange={onCountryFilterChange}
            disabled={shouldShowLoading}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Countries">
                {filterByCountry === "all"
                  ? "All Countries"
                  : filterByCountry.charAt(0).toUpperCase() +
                    filterByCountry.slice(1)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {availableCountries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country.charAt(0).toUpperCase() + country.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {counts.currentPage} of {counts.filtered} leads
          {counts.filtered !== counts.total &&
            ` (filtered from ${counts.total} total)`}
        </div>
      </div>
    </div>
  );
};
