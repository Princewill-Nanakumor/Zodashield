"use client";

import { Shield } from "lucide-react";

export const FilterSkeleton = () => (
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

export const TableSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div className="animate-pulse">
      {/* Table header skeleton */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="flex items-center gap-3">
            <div className="w-[120px] h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="w-[100px] h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>

      {/* Table rows skeleton */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="px-6 py-4 border-b border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/6"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const HeaderSkeleton = () => (
  <div className="flex items-center justify-between">
    <div>
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
    </div>
    <div className="flex items-center gap-3">
      <div className="w-24 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
      <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
      <div className="w-28 h-6 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
    </div>
  </div>
);

export const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="relative w-16 h-16 flex items-center justify-center">
      {/* Rotating border */}
      <div className="absolute inset-0 border-4 border-transparent border-t-blue-400 border-r-purple-500 rounded-full animate-spin w-16 h-16"></div>

      <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600">
        <Shield size={28} className="text-white" />
      </div>
    </div>
  </div>
);
