// src/hooks/useBillingData.ts
import { useQuery } from "@tanstack/react-query";

interface Transaction {
  id: string;
  amount: number;
  status: string;
  date: string;
  type: string;
}

interface Payment {
  _id: string;
  amount: number;
  status: string;
  method: string;
  createdAt: string;
}

interface BillingData {
  balance: number;
  totalDeposits: number;
  pendingAmount: number;
  recentTransactions: Transaction[];
}

// Fetch function outside the hook to prevent recreation
const fetchBillingData = async (): Promise<BillingData> => {
  console.log(
    "🔍 Fetching billing data from /api/payments and /api/user/profile"
  );

  // Fetch payments
  const paymentsResponse = await fetch("/api/payments?limit=10", {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  console.log("🔍 Payments response status:", paymentsResponse.status);

  if (!paymentsResponse.ok) {
    console.error(
      "❌ Failed to fetch payments:",
      paymentsResponse.status,
      paymentsResponse.statusText
    );
    throw new Error("Failed to fetch payments");
  }

  const paymentsData = await paymentsResponse.json();
  console.log("🔍 Payments data received:", paymentsData);

  // Calculate totals
  const completedPayments = paymentsData.payments.filter(
    (payment: Payment) => payment.status === "COMPLETED"
  );
  const pendingPayments = paymentsData.payments.filter(
    (payment: Payment) => payment.status === "PENDING"
  );

  const totalDeposits = completedPayments.reduce(
    (sum: number, payment: Payment) => sum + payment.amount,
    0
  );
  const pendingAmount = pendingPayments.reduce(
    (sum: number, payment: Payment) => sum + payment.amount,
    0
  );

  // Transform payments to transactions
  const recentTransactions = paymentsData.payments.map((payment: Payment) => ({
    id: payment._id,
    amount: payment.amount,
    status: payment.status,
    date: payment.createdAt,
    type: payment.method === "CRYPTO" ? "USDT Deposit" : "Card Deposit",
  }));

  // Fetch user balance
  const userResponse = await fetch("/api/user/profile", {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  console.log("🔍 User response status:", userResponse.status);

  let balance = 0;
  if (userResponse.ok) {
    const userData = await userResponse.json();
    balance = userData.user?.balance || 0;
    console.log("🔍 User balance:", balance);
  } else {
    console.error(
      "❌ Failed to fetch user profile:",
      userResponse.status,
      userResponse.statusText
    );
  }

  const billingData: BillingData = {
    balance,
    totalDeposits,
    pendingAmount,
    recentTransactions,
  };

  console.log("�� Final billing data:", billingData);

  return billingData;
};

export const useBillingData = () => {
  const {
    data: billingData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["billing-data"],
    queryFn: fetchBillingData,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  console.log("🔍 useBillingData hook result:", {
    billingData,
    isLoading,
    error,
    hasData: !!billingData,
    balance: billingData?.balance,
    pendingAmount: billingData?.pendingAmount,
    transactionsCount: billingData?.recentTransactions?.length,
  });

  return {
    billingData: billingData || {
      balance: 0,
      totalDeposits: 0,
      pendingAmount: 0,
      recentTransactions: [],
    },
    isLoading,
    error,
    refreshBillingData: refetch,
  };
};
