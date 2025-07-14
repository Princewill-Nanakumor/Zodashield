"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import UsersManagement from "@/components/dashboardComponents/UserManagement";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

export default function UsersPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <UsersManagement />
    </QueryClientProvider>
  );
}
