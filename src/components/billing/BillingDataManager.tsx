// src/components/billing/BillingDataManager.tsx

"use client";

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

interface BillingDataManagerProps {
  setBillingData: (data: BillingData) => void;
}

export default function BillingDataManager({
  setBillingData,
}: BillingDataManagerProps) {
  const fetchBillingData = async () => {
    try {
      // Fetch payments
      const paymentsResponse = await fetch("/api/payments?limit=10");
      if (!paymentsResponse.ok) {
        throw new Error("Failed to fetch payments");
      }

      const paymentsData = await paymentsResponse.json();

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
      const recentTransactions = paymentsData.payments.map(
        (payment: Payment) => ({
          id: payment._id,
          amount: payment.amount,
          status: payment.status,
          date: payment.createdAt,
          type: payment.method === "CRYPTO" ? "USDT Deposit" : "Card Deposit",
        })
      );

      // Fetch user balance
      const userResponse = await fetch("/api/user/profile");
      let balance = 0;
      if (userResponse.ok) {
        const userData = await userResponse.json();
        balance = userData.user?.balance || 0;
      }

      setBillingData({
        balance,
        totalDeposits,
        pendingAmount,
        recentTransactions,
      });
    } catch (error) {
      console.error("Error fetching billing data:", error);
    }
  };

  return {
    fetchBillingData,
  };
}
