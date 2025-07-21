"use client";

import React, { useEffect, useState, useCallback } from "react";
import { X as CloseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import PaymentDetailsContent from "./PaymentDetailsContent";

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

interface PaymentDetailsModalProps {
  paymentId: string;
  isOpen: boolean;
  onClose: () => void;
  onNewPayment?: () => void;
  onViewAllPayments?: () => void;
  onClearPayment?: () => void;
}

export default function PaymentDetailsModal({
  paymentId,
  isOpen,
  onClose,
  onNewPayment = () => {},
  onClearPayment = () => {},
}: PaymentDetailsModalProps) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentDetails = useCallback(async () => {
    if (!paymentId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/payments/${paymentId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch payment details");
      }

      const data = await response.json();
      setPayment(data.payment);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch payment details"
      );
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    if (paymentId && isOpen) {
      fetchPaymentDetails();
    }
  }, [paymentId, isOpen, fetchPaymentDetails]);

  const handleClose = () => {
    // Clear localStorage
    localStorage.removeItem("currentPayment");
    localStorage.removeItem("paymentNetwork");
    localStorage.removeItem("paymentConfirmed");

    // Call the parent handlers
    onClearPayment();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Payment Details
            </h2>
            {payment && (
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Transaction ID: {payment.transactionId}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <CloseIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 bg-white dark:bg-gray-900 rounded-b-2xl">
          <PaymentDetailsContent
            loading={loading}
            error={error}
            payment={payment}
            onRetry={fetchPaymentDetails}
            onClose={handleClose}
            onNewPayment={onNewPayment}
            onClearPayment={onClearPayment}
          />
        </div>
      </div>
    </div>
  );
}
