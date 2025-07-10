"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Shield } from "lucide-react";
import ThemeToggle from "@/components/dashboardComponents/ThemeToggle";
import AboutComponent from "@/components/homepageComponents/About";
import Hero from "@/components/homepageComponents/Hero";
import ComingSoon from "@/components/homepageComponents/ComingSoon";

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    />
  );
}

export default function HomePage() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="px-6 py-4 bg-white/70 dark:bg-gray-900/80 backdrop-blur-lg shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-md">
              <Shield size={30} className="text-white" />
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              ZodaShield
            </div>
          </div>
          <div className="flex items-center space-x-4 h-10">
            {status === "loading" ? (
              <>
                <Skeleton className="h-full w-20" />
                <Skeleton className="h-full w-24" />
              </>
            ) : session ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-100 font-medium"
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-600 dark:hover:to-purple-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="px-4 py-2 text-indigo-600 dark:text-indigo-300 hover:text-indigo-800 dark:hover:text-indigo-100 font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-600 dark:hover:to-purple-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                >
                  Sign Up
                </Link>
              </>
            )}

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <Hero />
      <AboutComponent />
      <ComingSoon />
    </div>
  );
}
