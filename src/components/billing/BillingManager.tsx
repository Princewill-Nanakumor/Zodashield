"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Info, CreditCard, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import BillingSidebar from "./BillingSidebar";
import UsdtDepositSection from "./UsdtDepositSection";
import CardDepositSection from "./CardDepositSection";
import PaymentDetailsModal from "./PaymentDetailsModal";
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

  // Use refs to store managers to avoid dependency issues
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
  }, [currentPayment, network, amount]);

  // Load persisted payment on component mount
  useEffect(() => {
    if (paymentStorageRef.current) {
      paymentStorageRef.current.loadPaymentFromStorage();
    }
  }, []);

  // Save payment to localStorage when it changes
  useEffect(() => {
    if (currentPayment && paymentStorageRef.current) {
      paymentStorageRef.current.savePaymentToStorage();
    }
  }, [currentPayment, network, paymentConfirmed]);

  // Fetch billing data on component mount
  useEffect(() => {
    if (billingDataManagerRef.current) {
      setIsBillingLoading(true);
      billingDataManagerRef.current
        .fetchBillingData()
        .finally(() => setIsBillingLoading(false));
    }
  }, []);

  const handleCreatePayment = useCallback(async (e: React.FormEvent) => {
    if (paymentCreationManagerRef.current) {
      await paymentCreationManagerRef.current.handleCreatePayment(e);
    }
  }, []);

  const handleConfirmPayment = useCallback(async () => {
    if (!currentPayment) return;

    try {
      setPaymentConfirmed(true);
      if (paymentStorageRef.current) {
        paymentStorageRef.current.savePaymentToStorage(true);
      }

      // Here you would typically verify the payment on the blockchain
      // For now, we'll simulate the verification
      const response = await fetch(
        `/api/payments/${currentPayment._id}/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok && billingDataManagerRef.current) {
        billingDataManagerRef.current.fetchBillingData();
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
    }
  }, [currentPayment]);

  const handleShowPaymentDetails = useCallback(() => {
    if (currentPayment) {
      setCurrentPaymentId(currentPayment._id);
      setShowPaymentModal(true);
    }
  }, [currentPayment]);

  const handleBackToDeposit = useCallback(() => {
    if (paymentStorageRef.current) {
      paymentStorageRef.current.clearPaymentFromStorage();
    }
    setCurrentPayment(null);
    setPaymentConfirmed(false);
    setAmount("");
    setError(null);
  }, []);

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

  const handleCloseModal = useCallback(() => {
    setShowPaymentModal(false);
    setCurrentPaymentId("");
    setCurrentPayment(null);
  }, []);

  const handleTransactionClick = useCallback((transactionId: string) => {
    setCurrentPaymentId(transactionId);
    setShowPaymentModal(true);
  }, []);

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 rounded-lg border">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold dark:text-white text-gray-900 mb-2">
              Billing & Fund Account
            </h1>
            <p className="dark:text-gray-300 text-gray-600">
              Fund your account securely using USDT (Tether)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="dark:backdrop-blur-lg dark:bg-white/5 rounded-2xl p-6 shadow-lg dark:border dark:border-white/10 bg-white border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold dark:text-white text-gray-900">
                  Deposit Funds
                </h2>
                <div className="flex space-x-1">
                  <Button
                    onClick={() => setActiveTab("usdt")}
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
                    onClick={() => setActiveTab("card")}
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

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center">
                    <Info className="h-4 w-4 mr-2 text-red-600 dark:text-red-400" />
                    <span className="text-red-700 dark:text-red-300 text-sm">
                      {error}
                    </span>
                  </div>
                </div>
              )}

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
          />
        </div>
      </div>

      {/* Payment Details Modal */}
      <PaymentDetailsModal
        paymentId={currentPaymentId}
        isOpen={showPaymentModal}
        onClose={handleCloseModal}
      />
    </div>
  );
}
