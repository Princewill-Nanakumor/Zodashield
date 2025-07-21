"use client";

import React from "react";
import { AlertCircle, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PaymentStatusCard from "./PaymentStatusCard";
import {
  getStatusColor,
  getMethodColor,
  formatCurrency,
  formatDate,
} from "./PaymentUtils";

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

interface PaymentDetailsContentProps {
  loading: boolean;
  error: string | null;
  payment: Payment | null;
  onRetry: () => void;
  onClose: () => void;
  onNewPayment: () => void;
  onClearPayment: () => void;
}

export default function PaymentDetailsContent({
  loading,
  error,
  payment,
  onRetry,
  onClose,
  onNewPayment,
  onClearPayment,
}: PaymentDetailsContentProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center justify-center w-full h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={onRetry}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Payment not found
          </p>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2">
        {/* Payment Status Card */}
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
              <DollarSign className="h-5 w-5" />
              <span>Payment Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Amount
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(payment.amount, payment.currency)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Status
                </span>
                <Badge className={getStatusColor(payment.status)}>
                  {payment.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Method
                </span>
                <Badge className={getMethodColor(payment.method)}>
                  {payment.method}
                </Badge>
              </div>

              {payment.network && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Network
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {payment.network}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Created
                </span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {formatDate(payment.createdAt)}
                </span>
              </div>

              {payment.approvedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Approved
                  </span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {formatDate(payment.approvedAt)}
                  </span>
                </div>
              )}

              {payment.description && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Description
                  </span>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">
                    {payment.description}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <PaymentStatusCard
        payment={payment}
        onNewPayment={onNewPayment}
        onClearPayment={onClearPayment}
        onCloseModal={onClose}
      />
    </div>
  );
}
