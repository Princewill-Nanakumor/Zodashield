// src/components/billing/PaymentCreationManager.tsx

"use client";

const MIN_DEPOSIT = parseFloat(
  process.env.NEXT_PUBLIC_MIN_PAYMENT_AMOUNT || "10"
);
const MAX_DEPOSIT = parseFloat(
  process.env.NEXT_PUBLIC_MAX_PAYMENT_AMOUNT || "1000000"
);

interface CurrentPayment {
  _id: string;
  amount: number;
  currency: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  method: "CREDIT_CARD" | "PAYPAL" | "BANK_TRANSFER" | "CRYPTO";
  transactionId: string;
  description?: string;
  network?: "TRC20" | "ERC20";
  walletAddress?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

interface PaymentCreationManagerProps {
  amount: string;
  network: "TRC20" | "ERC20";
  setError: (error: string | null) => void;
  setIsSubmitting: (submitting: boolean) => void;
  setCurrentPayment: (payment: CurrentPayment | null) => void;
  setPaymentConfirmed: (confirmed: boolean) => void;
  setAmount: (amount: string) => void;
  billingDataManager: {
    fetchBillingData: () => Promise<void>;
  };
}

export default function PaymentCreationManager({
  amount,
  network,
  setError,
  setIsSubmitting,
  setCurrentPayment,
  setPaymentConfirmed,
  setAmount,
  billingDataManager,
}: PaymentCreationManagerProps) {
  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (parseFloat(amount) < MIN_DEPOSIT) {
      setError(`Minimum deposit amount is ${MIN_DEPOSIT} USDT`);
      return;
    }

    if (parseFloat(amount) > MAX_DEPOSIT) {
      setError(`Maximum deposit amount is ${MAX_DEPOSIT} USDT`);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency: "USD",
          method: "CRYPTO",
          network: network,
          description: `${amount} USDT deposit via ${network}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create payment");
      }

      const data = await response.json();
      console.log("Payment response:", data);

      if (data.success) {
        console.log("Setting current payment:", data.payment);
        setCurrentPayment(data.payment);
        setPaymentConfirmed(false);
        setAmount("");
        await billingDataManager.fetchBillingData();
      } else {
        throw new Error(data.error || "Failed to create payment");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create payment"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleCreatePayment,
  };
}
