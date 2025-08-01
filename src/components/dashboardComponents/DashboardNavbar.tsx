// src/components/dashboardComponents/DashboardNavbar.tsx
"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Search } from "lucide-react";
import { DashboardSearchBar } from "./DashboardSearchBar";
import ThemeToggle from "./ThemeToggle";
import { DateTimeDisplay } from "./DateTimeDisplay";
import { UserDropdownMenu } from "./UserDropdownMenu";
import { NotificationBell } from "./NotificationBell";
import { useUserProfileData } from "@/hooks/useNavbarData";

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
      onSearch(query);
    },
    [onSearch]
  );

  if (!mounted) {
    // SSR fallback
    return (
      <nav className="bg-gradient-to-r from-purple-300 to-purple-500 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 dark:border-1 shadow-lg px-8 py-4 flex items-center justify-between">
        <div className="flex-shrink-0 w-32" />
        <div className="flex-1 flex justify-center">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-purple-300" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 rounded-lg bg-white/90 border border-purple-200"
              disabled
            />
          </div>
        </div>
        <div className="flex items-center space-x-4 flex-shrink-0 w-32">
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
    <nav className="bg-gradient-to-r from-purple-300 to-purple-500 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 dark:border-1 shadow-lg px-8 py-4 flex items-center justify-between">
      <div className="flex-shrink-0" />
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
      <div className="flex items-center space-x-4 flex-shrink-0">
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
