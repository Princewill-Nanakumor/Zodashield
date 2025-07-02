"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    />
  );
}

export default function HomePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Navigation Skeleton */}
        <nav className="px-6 py-4 bg-white/70 dark:bg-gray-900/80 backdrop-blur-lg shadow-lg border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Skeleton className="h-8 w-32" />
            <div className="space-x-4 flex">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </nav>
        {/* Hero Skeleton */}
        <main className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center">
            <Skeleton className="h-12 w-2/3 mx-auto mb-6" />
            <Skeleton className="h-6 w-1/2 mx-auto mb-12" />
            <div className="flex justify-center space-x-6 mb-12">
              <Skeleton className="h-12 w-40" />
              <Skeleton className="h-12 w-40" />
            </div>
          </div>
          <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-12">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="text-center p-6 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg shadow-xl border border-gray-200 dark:border-gray-700"
              >
                <Skeleton className="w-12 h-12 mx-auto mb-6" />
                <Skeleton className="h-6 w-32 mx-auto mb-2" />
                <Skeleton className="h-4 w-48 mx-auto" />
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="px-6 py-4 bg-white/70 dark:bg-gray-900/80 backdrop-blur-lg shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            DriveCRM
          </div>
          <div className="space-x-4">
            {session ? (
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
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-6">
            Manage Your Leads Efficiently
          </h1>
          <p className="text-xl text-indigo-900/70 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
            Streamline your sales process, track leads, and close more deals
            with our powerful CRM solution.
          </p>
          <div className="space-x-6">
            {session ? (
              <Link
                href="/dashboard"
                className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-600 dark:hover:to-purple-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 dark:hover:from-indigo-600 dark:hover:to-purple-600 transition-all duration-200 font-medium shadow-md hover:shadow-lg"
                >
                  Get Started
                </Link>
                <Link
                  href="/signin"
                  className="px-8 py-3 border-2 border-indigo-600/20 dark:border-indigo-400/20 text-indigo-600 dark:text-indigo-300 rounded-lg hover:border-indigo-600/40 dark:hover:border-indigo-400/40 hover:bg-indigo-50 dark:hover:bg-gray-800 transition-all duration-200 font-medium"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            {
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              ),
              title: "Lead Management",
              description:
                "Track and manage your leads efficiently in one place",
            },
            {
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              ),
              title: "Analytics",
              description: "Get insights into your sales performance",
            },
            {
              icon: (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                />
              ),
              title: "Automation",
              description: "Automate your workflow and save time",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-2xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg shadow-xl hover:shadow-2xl transition-all duration-200 hover:-translate-y-1 border border-gray-200 dark:border-gray-700"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 dark:from-indigo-400/20 dark:to-purple-400/20 rounded-lg flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-6 h-6 text-indigo-600 dark:text-indigo-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {feature.icon}
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-indigo-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-indigo-900/70 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
