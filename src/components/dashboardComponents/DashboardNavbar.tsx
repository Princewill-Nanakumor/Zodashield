"use client";

import { Search, UserCircle } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { DashboardSearchBar } from "./DashboardSearchBar";
import ThemeToggle from "./ThemeToggle";

interface DashboardNavbarProps {
  onSearch: (query: string) => void;
  searchQuery: string;
  isLoading?: boolean;
}

export default function DashboardNavbar({
  onSearch,
  searchQuery,
  isLoading = false,
}: DashboardNavbarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    console.log("DashboardNavbar: searchQuery changed to:", searchQuery);
  }, [searchQuery]);

  const handleSearch = useCallback(
    (query: string) => {
      console.log("DashboardNavbar: onSearch called with:", query);
      onSearch(query);
    },
    [onSearch]
  );

  if (!mounted) {
    // SSR fallback
    return (
      <nav className="bg-gradient-to-r from-purple-300 to-purple-500 shadow-lg px-8 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Leads
          </h1>
        </div>
        <div className="relative w-full max-w-md mx-8">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-purple-300" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 rounded-lg bg-white/90 border border-purple-200"
            disabled
          />
        </div>
        <div className="flex items-center space-x-4">
          <UserCircle className="h-9 w-9 text-white" />
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-gradient-to-r from-purple-300 to-purple-500 shadow-lg px-8 py-4 flex items-center justify-between">
      {/* Left: Logo/Title */}
      <div className="flex items-center space-x-3">
        <h1 className="text-2xl font-bold text-white tracking-tight">Leads</h1>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 flex justify-center">
        <div className="w-full max-w-md">
          <DashboardSearchBar
            onSearch={handleSearch}
            searchQuery={searchQuery}
            isLoading={isLoading}
            placeholder="Search by name or email or phone..."
          />
        </div>
      </div>

      {/* Right: Theme/User Controls */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <ThemeToggle isLoading={isLoading} />

        {/* User Avatar */}
        <button
          className="p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50"
          disabled={isLoading}
        >
          <UserCircle className="h-9 w-9 text-white drop-shadow hover:text-white/80 transition-colors" />
        </button>
      </div>
    </nav>
  );
}
