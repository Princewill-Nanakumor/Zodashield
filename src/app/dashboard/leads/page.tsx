// src/app/dashboard/user-leads/page.tsx
"use client";

import UserLeadsContent from "@/components/leads/UserLeadsContent";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function UserLeadsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Enhanced QueryClient configuration
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
            retry: (failureCount, error) => {
              // Don't retry auth errors
              if (
                error?.message?.includes("Unauthorized") ||
                error?.message?.includes("401") ||
                error?.message?.includes("403")
              ) {
                return false;
              }
              return failureCount < 2;
            },
            refetchOnWindowFocus: false, // Prevent unnecessary refetches
            refetchOnMount: false, // Changed from "always" to prevent refetch on navigation
            refetchOnReconnect: "always", // Refetch when reconnecting
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  // Redirect admins away from this page
  useEffect(() => {
    if (status === "loading") return; // Wait for session to load

    if (status === "unauthenticated") {
      router.push("/signin");
      return;
    }

    if (session?.user?.role === "ADMIN") {
      router.push("/dashboard");
      return;
    }
  }, [session, status, router]);

  // Show loading while checking authentication
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-700 dark:text-gray-300">Loading...</p>
      </div>
    );
  }

  // Don't render anything if user is unauthenticated or admin
  if (status === "unauthenticated" || session?.user?.role === "ADMIN") {
    return null;
  }

  // Only render for non-admin users
  return (
    <QueryClientProvider client={queryClient}>
      <UserLeadsContent />

      {/* Development: React Query DevTools for debugging */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
          position="bottom"
        />
      )}
    </QueryClientProvider>
  );
}
