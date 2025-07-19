"use client";

import React, { useEffect, useState } from "react";
import { Info, CreditCard, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import BillingSidebar from "./BillingSidebar";
import UsdtDepositSection from "./UsdtDepositSection";
import CardDepositSection from "./CardDepositSection";
import PaymentDetailsModal from "./PaymentDetailsModal";

const MIN_DEPOSIT = 10;

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

export default function BillingManager() {
  const [amount, setAmount] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState("usdt");
  const [countdown, setCountdown] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [network, setNetwork] = useState<"TRC20" | "ERC20">("TRC20");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentPaymentId, setCurrentPaymentId] = useState<string>("");

  // State for billing data
  const [billingData, setBillingData] = useState<BillingData>({
    balance: 0,
    totalDeposits: 0,
    pendingAmount: 0,
    recentTransactions: [],
  });

  // Fetch billing data on component mount
  useEffect(() => {
    fetchBillingData();
  }, []);

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

      // Fetch user balance (you might need to create an API endpoint for this)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (parseFloat(amount) < MIN_DEPOSIT) {
      setError(`Minimum deposit amount is ${MIN_DEPOSIT} USDT`);
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
          walletAddress: "TNPZvdnJQjQf4zWkdt3R5ZQ7j5q5J5X5vJ",
          description: `${amount} USDT deposit via ${network}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create payment");
      }

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
        setCountdown(15); // Show success message for 15 seconds
        setAmount(""); // Clear the input

        // Refresh billing data after creating payment
        await fetchBillingData();

        // Show payment modal after 15 seconds
        setTimeout(() => {
          setCurrentPaymentId(data.payment._id);
          setShowPaymentModal(true);
        }, 15000);
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

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleNetwork = () => {
    setNetwork(network === "TRC20" ? "ERC20" : "TRC20");
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
  };

  const handleToggleInstructions = () => {
    setShowInstructions(!showInstructions);
  };

  const handleSwitchToUsdt = () => {
    setActiveTab("usdt");
  };

  const handleCloseModal = () => {
    setShowPaymentModal(false);
    setCurrentPaymentId("");
    setSubmitted(false);
    setCountdown(0);
  };

  const handleTransactionClick = (transactionId: string) => {
    setCurrentPaymentId(transactionId);
    setShowPaymentModal(true);
  };

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
                  submitted={submitted}
                  countdown={countdown}
                  showInstructions={showInstructions}
                  onNetworkToggle={toggleNetwork}
                  onAmountChange={handleAmountChange}
                  onSubmit={handleSubmit}
                  onToggleInstructions={handleToggleInstructions}
                  formatTime={formatTime}
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
