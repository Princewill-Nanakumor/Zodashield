"use client";

import { Search, UserCircle, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";

export default function DashboardNavbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <nav className="bg-gradient-to-r from-purple-300 to-purple-500 shadow-lg px-8 py-4 flex items-center justify-between">
        {/* Simplified SSR-compatible version */}
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
          />
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" className="opacity-0">
            <Sun className="h-[1.2rem] w-[1.2rem]" />
          </Button>
          <UserCircle className="h-9 w-9 text-white" />
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-gradient-to-r from-purple-300 to-purple-500 shadow-lg px-8 py-4 flex items-center justify-end">
      {/* ... other nav content ... */}

      {/* Right Section - User Controls */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-white/20 hover:bg-white/30 border-white/30 text-white"
            >
              {theme === "dark" ? (
                <Moon className="h-[1.2rem] w-[1.2rem]" />
              ) : (
                <Sun className="h-[1.2rem] w-[1.2rem]" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => setTheme("light")}
              className="cursor-pointer"
            >
              Light
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("dark")}
              className="cursor-pointer"
            >
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setTheme("system")}
              className="cursor-pointer"
            >
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Avatar */}
        <button className="p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-white/50">
          <UserCircle className="h-9 w-9 text-white drop-shadow hover:text-white/80 transition-colors" />
        </button>
      </div>
    </nav>
  );
}
