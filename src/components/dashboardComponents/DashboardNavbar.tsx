"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Search,
  ChevronUp,
  ChevronDown,
  LayoutDashboard,
  Filter,
} from "lucide-react";
import { DashboardSearchBar } from "./DashboardSearchBar";
import ThemeToggle from "./ThemeToggle";
import { DateTimeDisplay } from "./DateTimeDisplay";
import { UserDropdownMenu } from "./UserDropdownMenu";
import { NotificationBell } from "../notifications/NotificationBell";
import { useUserProfileData } from "@/hooks/useNavbarData";

interface DashboardNavbarProps {
  onSearch: (query: string) => void;
  searchQuery: string;
  isLoading?: boolean;
  // New props for toggle functionality
  showHeader?: boolean;
  showControls?: boolean;
  onToggleHeader?: () => void;
  onToggleControls?: () => void;
  // Only show these buttons on leads pages
  showLeadsToggles?: boolean;
}

export default function DashboardNavbar({
  onSearch,
  searchQuery,
  isLoading = false,
  showHeader = true,
  showControls = true,
  onToggleHeader,
  onToggleControls,
  showLeadsToggles = false,
}: DashboardNavbarProps) {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use React Query for user profile data
  const { userProfile, isLoading: profileLoading } = useUserProfileData();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Dropdown close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleSearch = useCallback(
    (query: string) => {
      console.log("DashboardNavbar: Search triggered with query:", query);
      onSearch(query);
    },
    [onSearch]
  );

  if (!mounted) {
    // SSR fallback
    return (
      <nav className="flex items-center justify-between px-8 py-4 shadow-lg bg-gradient-to-r from-purple-300 to-purple-500 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 dark:border-1">
        <div className="flex-shrink-0 w-32" />
        <div className="flex justify-center flex-1">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-5 h-5 text-purple-300" />
            </div>
            <input
              type="text"
              className="block w-full py-2 pl-10 pr-3 border border-purple-200 rounded-lg bg-white/90"
              disabled
            />
          </div>
        </div>
        <div className="flex items-center flex-shrink-0 w-32 space-x-4">
          <UserDropdownMenu
            session={session}
            userProfile={userProfile}
            balanceLoading={profileLoading}
            dropdownOpen={dropdownOpen}
            setDropdownOpen={setDropdownOpen}
            dropdownRef={dropdownRef}
          />
        </div>
      </nav>
    );
  }

  return (
    <nav className="flex items-center justify-between px-8 py-4 shadow-lg bg-gradient-to-r from-purple-300 to-purple-500 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 dark:border-1">
      {/* Left side - Toggle buttons for leads pages */}
      <div className="flex items-center flex-shrink-0 space-x-2">
        {showLeadsToggles && (
          <>
            <button
              onClick={onToggleHeader}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium 
                         text-purple-700 hover:text-purple-800 bg-white/20 hover:bg-white/30 
                         dark:text-gray-200 dark:hover:text-white dark:bg-white/10 dark:hover:bg-white/20 
                         rounded-md transition-colors border border-white/20 dark:border-gray-600/50"
              title={`${showHeader ? "Hide" : "Show"} Header`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              {showHeader ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              onClick={onToggleControls}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium 
                         text-purple-700 hover:text-purple-800 bg-white/20 hover:bg-white/30 
                         dark:text-gray-200 dark:hover:text-white dark:bg-white/10 dark:hover:bg-white/20 
                         rounded-md transition-colors border border-white/20 dark:border-gray-600/50"
              title={`${showControls ? "Hide" : "Show"} Controls`}
            >
              <Filter className="h-3.5 w-3.5" />
              {showControls ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </button>
          </>
        )}
      </div>

      {/* Center - Search bar */}
      <div className="flex justify-center flex-1 mx-4">
        <div className="w-full max-w-md">
          <DashboardSearchBar
            onSearch={handleSearch}
            searchQuery={searchQuery}
            isLoading={isLoading}
            placeholder="Search by name, email, or phone..."
          />
        </div>
      </div>

      {/* Right side - Other controls */}
      <div className="flex items-center flex-shrink-0 space-x-4">
        <DateTimeDisplay />
        <NotificationBell />
        <ThemeToggle isLoading={isLoading} />
        <UserDropdownMenu
          session={session}
          userProfile={userProfile}
          balanceLoading={profileLoading}
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
          dropdownRef={dropdownRef}
        />
      </div>
    </nav>
  );
}
