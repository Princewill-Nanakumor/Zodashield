// src/hooks/useAdminStatuses.ts
import { useQuery } from "@tanstack/react-query";

interface Status {
  id: string;
  name: string;
  color?: string;
}

export const useAdminStatuses = () => {
  return useQuery<Status[]>({
    queryKey: ["admin-statuses"],
    queryFn: async (): Promise<Status[]> => {
      const response = await fetch("/api/statuses", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch statuses");
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    refetchOnMount: false,
  });
};
