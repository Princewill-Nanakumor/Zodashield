// src/components/billing/PaymentStatusCard.tsx

"use client";

import React from "react";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Payment {
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

interface PaymentStatusCardProps {
  payment: Payment;
  onNewPayment: () => void;
  onClearPayment: () => void;
  onCloseModal: () => void;
}

export default function PaymentStatusCard({
  payment,
  onNewPayment,
  onClearPayment,
  onCloseModal,
}: PaymentStatusCardProps) {
  const handleNewPayment = () => {
    // Clear ALL payment-related localStorage items
    const keysToRemove = [
      "currentPayment",
      "paymentNetwork",
      "paymentConfirmed",
      "paymentAmount",
      "paymentCurrency",
      "paymentId",
      "paymentStatus",
      "paymentMethod",
      "paymentCreatedAt",
      "paymentWalletAddress",
      "paymentTransactionId",
      "paymentDescription",
      "paymentApprovedAt",
      "paymentApprovedBy",
    ];

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key);
    });

    // Also clear any sessionStorage items
    keysToRemove.forEach((key) => {
      sessionStorage.removeItem(key);
    });

    // Call the parent handler to reset state
    onClearPayment();

    // Close the modal
    onCloseModal();

    // Call the new payment handler
    onNewPayment();
  };

  return (
    <div className="space-y-6">
      {/* Status Indicator */}
      <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">
            Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            {payment.status === "COMPLETED" ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : payment.status === "PENDING" ? (
              <Clock className="h-5 w-5 text-yellow-600 animate-spin" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {payment.status}
            </span>
          </div>

          {payment.status === "PENDING" && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Waiting for confirmation
            </p>
          )}

          {payment.status === "COMPLETED" && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-2">
              Payment successful
            </p>
          )}

          {payment.status === "FAILED" && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
              Payment failed
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleNewPayment}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              New Payment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Blockchain Explorer Link */}
      {payment.method === "CRYPTO" &&
        payment.walletAddress &&
        payment.network && (
          <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                Blockchain Explorer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href={
                  payment.network === "TRC20"
                    ? `https://tronscan.org/#/address/${payment.walletAddress}`
                    : `https://etherscan.io/address/${payment.walletAddress}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                View on {payment.network === "TRC20" ? "Tronscan" : "Etherscan"}{" "}
                <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
