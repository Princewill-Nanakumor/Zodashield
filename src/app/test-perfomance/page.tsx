// src/app/test-perfomance/page.tsx
"use client";

import PerformanceDashboard from "@/components/dashboardComponents/PerformanceDashboard";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function PerformanceDashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Force page refresh to get latest data
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back to Home</span>
              </Link>
              <div className="hidden sm:block w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Performance Dashboard
              </h1>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                size={16}
                className={isRefreshing ? "animate-spin" : ""}
              />
              <span>Refresh Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto py-8">
        <PerformanceDashboard />
      </div>

      {/* Footer Info */}
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="container mx-auto px-6 py-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Performance metrics are updated in real-time. Data includes Core
              Web Vitals (LCP, INP, CLS) and business metrics.
            </p>
            <div className="flex justify-center space-x-6 mt-4 text-xs text-gray-500 dark:text-gray-500">
              <span>🟢 Good</span>
              <span>🟡 Needs Improvement</span>
              <span>🔴 Poor</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
