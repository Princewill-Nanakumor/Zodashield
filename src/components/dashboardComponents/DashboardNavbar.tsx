"use client";

import { Search, UserCircle } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { DashboardSearchBar } from "./DashboardSearchBar";
import ThemeToggle from "./ThemeToggle";
import { LogOut, User, Settings } from "lucide-react";

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
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const handleProfile = () => {
    setDropdownOpen(false);
    router.push("/dashboard/profile");
  };

  const handleSettings = () => {
    setDropdownOpen(false);
    router.push("/dashboard/settings");
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await signOut({ callbackUrl: "/signin" });
  };

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

        {/* User Avatar Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            className="p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50"
            disabled={isLoading}
            onClick={() => setDropdownOpen((open) => !open)}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
            aria-label="User menu"
            type="button"
          >
            <div className="relative">
              <UserCircle className="h-9 w-9 text-white drop-shadow hover:text-white/80 transition-colors" />
              <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white" />
            </div>
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 dark:divide-gray-700 rounded-md bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black/10 dark:ring-white/10 z-[60] overflow-hidden transition-all duration-200 ease-out transform opacity-100 scale-100">
              {/* User Info Section */}
              <div className="px-4 py-3">
                <div className="flex items-center">
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {session?.user?.firstName && session?.user?.lastName
                        ? `${session.user.firstName} ${session.user.lastName}`
                        : "User"}
                    </p>

                    <div className="flex items-center">
                      <span className="block h-2 w-2 rounded-full bg-green-400 mr-1" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Online
                      </p>
                    </div>
                    <div className="mt-1">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                        Balance:{" "}
                        <span className="text-green-600 dark:text-green-400">
                          $0
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={handleProfile}
                  className="flex w-full items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-700/80 transition-colors duration-150 ease-in-out"
                >
                  <User className="h-4 w-4 mr-3 text-purple-500 dark:text-purple-400" />
                  Profile
                </button>
                <button
                  onClick={handleSettings}
                  className="flex w-full items-center px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-700/80 transition-colors duration-150 ease-in-out"
                >
                  <Settings className="h-4 w-4 mr-3 text-blue-500 dark:text-blue-400" />
                  Settings
                </button>
              </div>
              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 ease-in-out"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
