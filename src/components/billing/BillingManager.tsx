// src/components/billing/BillingManager.tsx

"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { CreditCard, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import BillingSidebar from "./BillingSidebar";
import UsdtDepositSection from "./UsdtDepositSection";
import CardDepositSection from "./CardDepositSection";
import PaymentDetailsModal from "./PaymentDetailsModal";
import BillingHeader from "./BillingHeader";
import PaymentStorageManager from "./PaymentStorageManager";
import { useBillingSummary } from "@/hooks/useBillingData";
import { useCreatePayment } from "@/hooks/usePaymentMutations";
import { Payment } from "@/types/payment.types";

const MIN_DEPOSIT = parseFloat(
  process.env.NEXT_PUBLIC_MIN_PAYMENT_AMOUNT || "10"
);
const MAX_DEPOSIT = parseFloat(
  process.env.NEXT_PUBLIC_MAX_PAYMENT_AMOUNT || "1000000"
);

export default function BillingManager() {
  const [amount, setAmount] = useState("");
  const [activeTab, setActiveTab] = useState("usdt");
  const [showInstructions, setShowInstructions] = useState(false);
  const [network, setNetwork] = useState<"TRC20" | "ERC20">("TRC20");
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentPaymentId, setCurrentPaymentId] = useState<string>("");
  const [currentPayment, setCurrentPayment] = useState<Payment | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  // React Query hooks
  const { billingData, isLoading: isBillingLoading } = useBillingSummary();
  const createPaymentMutation = useCreatePayment();

  // Payment storage manager - memoized to prevent recreating on every render
  const paymentStorageManager = useMemo(
    () =>
      PaymentStorageManager({
        currentPayment,
        network,
        setCurrentPayment,
        setNetwork,
        setPaymentConfirmed,
      }),
    [currentPayment, network]
  );

  // Load persisted payment on component mount
  useEffect(() => {
    paymentStorageManager.loadPaymentFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save payment to localStorage when it changes
  useEffect(() => {
    if (currentPayment) {
      paymentStorageManager.savePaymentToStorage(paymentConfirmed);
    }
  }, [currentPayment, network, paymentConfirmed, paymentStorageManager]);

  // Handle payment creation
  const handleCreatePayment = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      const amountNum = parseFloat(amount);

      if (amountNum < MIN_DEPOSIT) {
        setError(`Minimum deposit amount is ${MIN_DEPOSIT} USDT`);
        return;
      }

      if (amountNum > MAX_DEPOSIT) {
        setError(`Maximum deposit amount is ${MAX_DEPOSIT} USDT`);
        return;
      }

      try {
        const result = await createPaymentMutation.mutateAsync({
          amount: amountNum,
          currency: "USD",
          method: "CRYPTO",
          network: network,
          description: `${amount} USDT deposit via ${network}`,
        });

        if (result.success) {
          setCurrentPayment(result.payment);
          setPaymentConfirmed(false);
          setAmount("");
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to create payment"
        );
      }
    },
    [amount, network, createPaymentMutation]
  );

  const toggleNetwork = useCallback(() => {
    setNetwork(network === "TRC20" ? "ERC20" : "TRC20");
  }, [network]);

  const handleAmountChange = useCallback((value: string) => {
    setAmount(value);
  }, []);

  const handleToggleInstructions = useCallback(() => {
    setShowInstructions(!showInstructions);
  }, [showInstructions]);

  const handleSwitchToUsdt = useCallback(() => {
    setActiveTab("usdt");
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  // Payment action handlers
  const handleConfirmPayment = useCallback(() => {
    setPaymentConfirmed(true);
    paymentStorageManager.savePaymentToStorage(true);
  }, [paymentStorageManager]);

  const handleShowPaymentDetails = useCallback(() => {
    if (currentPayment) {
      setCurrentPaymentId(currentPayment._id);
      setShowPaymentModal(true);
    }
  }, [currentPayment]);

  const handleBackToDeposit = useCallback(() => {
    setCurrentPayment(null);
    setPaymentConfirmed(false);
    setAmount("");
    setError(null);
    paymentStorageManager.clearPaymentFromStorage();
  }, [paymentStorageManager]);

  const handleCloseModal = useCallback(() => {
    setShowPaymentModal(false);
    setCurrentPaymentId("");
  }, []);

  const handleTransactionClick = useCallback(
    (transactionId: string) => {
      // Don't open modal if there's an unconfirmed payment
      if (currentPayment && !paymentConfirmed) {
        return;
      }

      setCurrentPaymentId(transactionId);
      setShowPaymentModal(true);
    },
    [currentPayment, paymentConfirmed]
  );

  const handleClearPayment = useCallback(() => {
    setCurrentPayment(null);
    setPaymentConfirmed(false);
    setAmount("");
    setError(null);
    setShowPaymentModal(false);
    setCurrentPaymentId("");
    paymentStorageManager.clearPaymentFromStorage();
  }, [paymentStorageManager]);

  const handleNewPayment = useCallback(() => {
    handleClearPayment();
    setActiveTab("usdt");
    setNetwork("TRC20");
    setShowInstructions(false);
  }, [handleClearPayment]);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 rounded-lg border">
        {/* Header */}
        <BillingHeader activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            <div className="dark:backdrop-blur-lg dark:bg-white/5 rounded-2xl p-6 shadow-lg dark:border dark:border-white/10 bg-white border border-gray-200">
              {/* Tab Navigation */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold dark:text-white text-gray-900">
                  Deposit Funds
                </h2>
                <div className="flex space-x-1">
                  <Button
                    onClick={() => handleTabChange("usdt")}
                    className={`px-4 py-2 mr-4 rounded-lg text-sm font-medium ${
                      activeTab === "usdt"
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                        : "dark:bg-transparent dark:hover:bg-white/10 dark:border dark:border-white/20 dark:text-white bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300"
                    }`}
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Crypto
                  </Button>
                  <Button
                    onClick={() => handleTabChange("card")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      activeTab === "card"
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                        : "dark:bg-transparent dark:hover:bg-white/10 dark:border dark:border-white/20 dark:text-white bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300"
                    }`}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Card Deposit
                  </Button>
                </div>
              </div>

              {/* USDT Deposit Section */}
              {activeTab === "usdt" ? (
                <UsdtDepositSection
                  network={network}
                  amount={amount}
                  isSubmitting={createPaymentMutation.isPending}
                  error={error}
                  currentPayment={currentPayment}
                  paymentConfirmed={paymentConfirmed}
                  showInstructions={showInstructions}
                  onNetworkToggle={toggleNetwork}
                  onAmountChange={handleAmountChange}
                  onCreatePayment={handleCreatePayment}
                  onConfirmPayment={handleConfirmPayment}
                  onShowPaymentDetails={handleShowPaymentDetails}
                  onToggleInstructions={handleToggleInstructions}
                  onBackToDeposit={handleBackToDeposit}
                />
              ) : (
                <CardDepositSection onSwitchToUsdt={handleSwitchToUsdt} />
              )}
            </div>
          </div>

          {/* Right Column - Billing Sidebar */}
          <BillingSidebar
            balance={billingData.balance}
            totalDeposits={billingData.totalDeposits}
            pendingAmount={billingData.pendingAmount}
            recentTransactions={billingData.recentTransactions}
            onTransactionClick={handleTransactionClick}
            isLoading={isBillingLoading}
            hasUnconfirmedPayment={!!(currentPayment && !paymentConfirmed)}
          />
        </div>
      </div>

      {/* Payment Details Modal */}
      <PaymentDetailsModal
        paymentId={currentPaymentId}
        isOpen={showPaymentModal}
        onClose={handleCloseModal}
        onNewPayment={handleNewPayment}
        onClearPayment={handleClearPayment}
      />
    </div>
  );
}
