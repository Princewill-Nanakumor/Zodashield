//drivecrm/src/app/dashboard/all-leads/page.tsx

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LeadsPageContent from "@/components/dashboardComponents/LeadsPageContent";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const AllLeadsPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

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
      <LeadsPageContent />
    </QueryClientProvider>
  );
};

export default AllLeadsPage;
