// src/app/dashboard/user-leads/page.tsx
"use client";

import UserLeadsContent from "@/components/leads/UserLeadsContent";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function UserLeadsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Create QueryClient inside the component to avoid server/client mismatch
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
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
    </QueryClientProvider>
  );
}
