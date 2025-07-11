"use client";

import { StatusProvider } from "@/context/StatusContext";
import UserLeadsContent from "@/components/leads/UserLeadsTableContent";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function UserLeadsPage() {
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

  return (
    <QueryClientProvider client={queryClient}>
      <StatusProvider>
        <UserLeadsContent />
      </StatusProvider>
    </QueryClientProvider>
  );
}
