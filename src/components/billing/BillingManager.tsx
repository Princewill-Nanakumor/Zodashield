// src/components/billing/BillingManager.tsx

"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { CreditCard, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import BillingSidebar from "./BillingSidebar";
import UsdtDepositSection from "./UsdtDepositSection";
import CardDepositSection from "./CardDepositSection";
import PaymentDetailsModal from "./PaymentDetailsModal";
import BillingHeader from "./BillingHeader";
import PaymentStorageManager from "./PaymentStorageManager";
import BillingDataManager from "./BillingDataManager";
import PaymentCreationManager from "./PaymentCreationManager";

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

export default function BillingManager() {
  const [amount, setAmount] = useState("");
  const [activeTab, setActiveTab] = useState("usdt");
  const [showInstructions, setShowInstructions] = useState(false);
  const [network, setNetwork] = useState<"TRC20" | "ERC20">("TRC20");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentPaymentId, setCurrentPaymentId] = useState<string>("");
  const [currentPayment, setCurrentPayment] = useState<CurrentPayment | null>(
    null
  );
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [isBillingLoading, setIsBillingLoading] = useState(true);

  // State for billing data
  const [billingData, setBillingData] = useState<BillingData>({
    balance: 0,
    totalDeposits: 0,
    pendingAmount: 0,
    recentTransactions: [],
  });

  // Use refs to store managers
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

  // Load persisted payment on component mount
  useEffect(() => {
    if (paymentStorageRef.current) {
      paymentStorageRef.current.loadPaymentFromStorage();
    }
  }, [paymentStorageRef]);

  // Save payment to localStorage when it changes
  useEffect(() => {
    if (currentPayment && paymentStorageRef.current) {
      paymentStorageRef.current.savePaymentToStorage();
    }
  }, [currentPayment, network, paymentConfirmed, paymentStorageRef]);

  // Fetch billing data on component mount
  useEffect(() => {
    if (billingDataManagerRef.current) {
      setIsBillingLoading(true);
      billingDataManagerRef.current
        .fetchBillingData()
        .finally(() => setIsBillingLoading(false));
    }
  }, [billingDataManagerRef]);

  const handleCreatePayment = useCallback(
    async (e: React.FormEvent) => {
      if (paymentCreationManagerRef.current) {
        await paymentCreationManagerRef.current.handleCreatePayment(e);
      }
    },
    [paymentCreationManagerRef]
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
    if (paymentStorageRef.current) {
      paymentStorageRef.current.savePaymentToStorage(true);
    }
  }, [paymentStorageRef]);

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
    if (paymentStorageRef.current) {
      paymentStorageRef.current.clearPaymentFromStorage();
    }
  }, [paymentStorageRef]);

  const handleCloseModal = useCallback(() => {
    setShowPaymentModal(false);
    setCurrentPaymentId("");
  }, []);

  // Updated handleTransactionClick to prevent opening modal when there's an unconfirmed payment
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

  // New function to handle clearing payment completely
  const handleClearPayment = useCallback(() => {
    // Clear all state
    setCurrentPayment(null);
    setPaymentConfirmed(false);
    setAmount("");
    setError(null);
    setShowPaymentModal(false);
    setCurrentPaymentId("");

    // Clear localStorage completely
    if (paymentStorageRef.current) {
      paymentStorageRef.current.clearPaymentFromStorage();
    }
  }, [paymentStorageRef]);

  // New function to handle new payment
  const handleNewPayment = useCallback(() => {
    handleClearPayment();
    // Reset to initial state
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
              {/* Tab Navigation - Now inside the main content card */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold dark:text-white text-gray-900">
                  Deposit Funds
                </h2>
                <div className="flex space-x-1">
                  <Button
                    onClick={() => handleTabChange("usdt")}
                    className={`px-4 py-2 mr-4 rounded-lg text-sm font-medium ${
                      activeTab === "usdt"
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
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
                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
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
                  isSubmitting={isSubmitting}
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
