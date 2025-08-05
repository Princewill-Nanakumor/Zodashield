"use client";

import { Component, ReactNode } from "react";
import { Shield, RefreshCw, Wifi, WifiOff } from "lucide-react";

export const TableSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
    <div className="animate-pulse">
      {/* Table header skeleton */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
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
          </div>
        </div>
      ))}
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

// New component for session refresh
export const SessionRefreshSpinner = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="text-center">
      <div className="relative w-16 h-16 flex items-center justify-center mx-auto mb-4">
        <div className="absolute inset-0 border-4 border-transparent border-t-blue-400 border-r-purple-500 rounded-full animate-spin w-16 h-16"></div>
        <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600">
          <RefreshCw size={28} className="text-white" />
        </div>
      </div>
      <p className="text-gray-600 dark:text-gray-400">Refreshing session...</p>
    </div>
  </div>
);

// New component for network status
export const NetworkStatus = ({ isOnline }: { isOnline: boolean }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="mb-4">
        {isOnline ? (
          <Wifi className="h-12 w-12 text-green-500 mx-auto" />
        ) : (
          <WifiOff className="h-12 w-12 text-red-500 mx-auto" />
        )}
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {isOnline ? "Connected" : "No Internet Connection"}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        {isOnline
          ? "You're back online. Refreshing data..."
          : "Please check your internet connection and try again."}
      </p>
      {!isOnline && (
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry Connection
        </button>
      )}
    </div>
  </div>
);

// ✅ FIXED: Error Boundary as Class Component
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      // Use the fallback prop if provided, otherwise show default error UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="mb-4">
              <Shield className="h-12 w-12 text-red-500 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// New component for data refresh indicator
export const DataRefreshIndicator = ({
  isRefreshing,
}: {
  isRefreshing: boolean;
}) => {
  if (!isRefreshing) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span className="text-sm">Refreshing data...</span>
      </div>
    </div>
  );
};
