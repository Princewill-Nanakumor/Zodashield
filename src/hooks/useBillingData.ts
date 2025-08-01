// src/hooks/useBillingData.ts
import { useQuery } from "@tanstack/react-query";

interface Transaction {
  id: string;
  amount: number;
  status: string;
  date: string;
  type: string;
}

interface BillingData {
  balance: number;
  totalDeposits: number;
  pendingAmount: number;
  recentTransactions: Transaction[];
}

export const useBillingData = () => {
  const {
    data: billingData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["billing-data"],
    queryFn: async (): Promise<BillingData> => {
      const response = await fetch("/api/billing");
      if (!response.ok) {
        throw new Error("Failed to fetch billing data");
      }
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  return {
    billingData,
    isLoading,
    error,
    refreshBillingData: refetch,
  };
};
