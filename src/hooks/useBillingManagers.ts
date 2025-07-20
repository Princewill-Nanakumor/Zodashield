// src/hooks/useBillingManagers.ts

"use client";

import { useEffect, useRef } from "react";
import PaymentStorageManager from "../components/billing/PaymentStorageManager";
import BillingDataManager from "../components/billing/BillingDataManager";
import PaymentCreationManager from "../components/billing/PaymentCreationManager";

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

// Manager interfaces
interface PaymentStorageManagerType {
  loadPaymentFromStorage: () => void;
  savePaymentToStorage: (confirmed?: boolean) => void;
  clearPaymentFromStorage: () => void;
}

interface BillingDataManagerType {
  fetchBillingData: () => Promise<void>;
}

interface PaymentCreationManagerType {
  handleCreatePayment: (e: React.FormEvent) => Promise<void>;
}

interface UseBillingManagersProps {
  currentPayment: CurrentPayment | null;
  network: "TRC20" | "ERC20";
  amount: string;
  setCurrentPayment: (payment: CurrentPayment | null) => void;
  setNetwork: (network: "TRC20" | "ERC20") => void;
  setPaymentConfirmed: (confirmed: boolean) => void;
  setError: (error: string | null) => void;
  setIsSubmitting: (submitting: boolean) => void;
  setAmount: (amount: string) => void;
  setBillingData: (data: BillingData) => void;
}

export default function useBillingManagers({
  currentPayment,
  network,
  amount,
  setCurrentPayment,
  setNetwork,
  setPaymentConfirmed,
  setError,
  setIsSubmitting,
  setAmount,
  setBillingData,
}: UseBillingManagersProps) {
  const paymentStorageRef = useRef<PaymentStorageManagerType | null>(null);
  const billingDataManagerRef = useRef<BillingDataManagerType | null>(null);
  const paymentCreationManagerRef = useRef<PaymentCreationManagerType | null>(
    null
  );

  // Initialize managers
  useEffect(() => {
    paymentStorageRef.current = PaymentStorageManager({
      currentPayment,
      network,
      setCurrentPayment,
      setNetwork,
      setPaymentConfirmed,
    });

    billingDataManagerRef.current = BillingDataManager({
      setBillingData,
    });

    paymentCreationManagerRef.current = PaymentCreationManager({
      amount,
      network,
      setError,
      setIsSubmitting,
      setCurrentPayment,
      setPaymentConfirmed,
      setAmount,
      billingDataManager: billingDataManagerRef.current!,
    });
  }, [
    currentPayment,
    network,
    amount,
    setCurrentPayment,
    setNetwork,
    setPaymentConfirmed,
    setError,
    setIsSubmitting,
    setAmount,
    setBillingData,
  ]);

  return {
    paymentStorageRef,
    billingDataManagerRef,
    paymentCreationManagerRef,
  };
}
