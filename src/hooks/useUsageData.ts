// src/hooks/useUsageData.ts
import { useQuery } from "@tanstack/react-query";

interface UsageData {
  currentLeads: number;
  maxLeads: number;
  remainingLeads: number;
  canImport: boolean;
}

interface ApiUsageData {
  canImport: boolean;
  canAddTeamMember: boolean;
  currentLeads: number;
  maxLeads: number;
  currentUsers: number;
  maxUsers: number;
  remainingLeads: number;
  remainingUsers: number;
}

export const useUsageData = () => {
  const {
    data: apiData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["usage-limits"],
    queryFn: async (): Promise<ApiUsageData> => {
      const response = await fetch("/api/usage");
      if (!response.ok) {
        throw new Error("Failed to fetch usage data");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Transform the API data to match the expected interface
  const usageData: UsageData | null = apiData
    ? {
        currentLeads: apiData.currentLeads,
        maxLeads: apiData.maxLeads,
        remainingLeads: apiData.remainingLeads,
        canImport: apiData.canImport,
      }
    : null;

  return {
    usageData,
    isLoading,
    error,
    refreshUsageData: refetch,
  };
};
