"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LeadsPageContent from "@/components/dashboardComponents/LeadsPageContent";
import { useEffect } from "react";
import { useSearchContext } from "@/context/SearchContext";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false, // Prevent refetch on focus
      refetchOnReconnect: true,
      refetchOnMount: true,
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    },
  },
});

const AllLeadsPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Get search context from layout
  const { searchQuery, isLoading, setLayoutLoading } = useSearchContext();

  // Add debug logging
  useEffect(() => {
    console.log("AllLeadsPage: Received context values:", {
      searchQuery,
      isLoading,
    });
  }, [searchQuery, isLoading]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 dark:border-white border-t-transparent"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/signin");
    return null;
  }

  if (status === "authenticated" && session?.user?.role !== "ADMIN") {
    router.push("/dashboard");
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <LeadsPageContent
        searchQuery={searchQuery}
        isLoading={isLoading}
        setLayoutLoading={setLayoutLoading}
      />
    </QueryClientProvider>
  );
};

export default AllLeadsPage;
