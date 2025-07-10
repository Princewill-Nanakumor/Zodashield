// components/homepageComponents/Hero.tsx
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
    />
  );
}

export default function Hero() {
  const { data: session, status } = useSession();

  return (
    <main className="max-w-7xl mx-auto px-6 py-20">
      <div className="text-center">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent mb-6">
          Transform Your Excel & CSV Data into Actionable Leads
        </h1>
        <p className="text-xl text-indigo-900/70 dark:text-gray-300 mb-12 max-w-2xl mx-auto">
          Streamline your data processing, import Excel and CSV files
          seamlessly, and manage leads efficiently with ZodaShield. Turn your
          spreadsheet data into powerful customer relationships.
        </p>
        <div className="flex justify-center space-x-6 h-12">
          {status === "loading" ? (
            <>
              <Skeleton className="h-full w-40 rounded-lg" />
              <Skeleton className="h-full w-32 rounded-lg" />
            </>
          ) : session ? (
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
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
              />
            ),
            title: "Excel & CSV Import",
            description:
              "Import your spreadsheet data with intelligent field mapping and validation",
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
            title: "Data Analytics",
            description:
              "Get insights into your imported data and sales performance",
          },
          {
            icon: (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            ),
            title: "Team Management",
            description:
              "Collaborate with your team to process and manage imported leads",
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
  );
}
