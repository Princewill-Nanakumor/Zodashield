// src/components/adminManagement/PaymentDetails.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  DollarSign,
  Calendar,
  Clock,
  AlertCircle,
} from "lucide-react";

interface Payment {
  _id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  transactionId: string;
  createdAt: string;
  description?: string;
  subscriptionId?: string;
}

interface PaymentDetailsProps {
  payments: Payment[];
}

export default function PaymentDetails({ payments }: PaymentDetailsProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
      case "FAILED":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-200 dark:border-red-800";
      case "REFUNDED":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300 border-gray-200 dark:border-gray-800";
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "CREDIT_CARD":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 border-purple-200 dark:border-purple-800";
      case "PAYPAL":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "BANK_TRANSFER":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-800";
      case "CRYPTO":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300 border-orange-200 dark:border-orange-800";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300 border-gray-200 dark:border-gray-800";
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getTotalAmount = () => {
    return payments
      .filter((payment) => payment.status === "COMPLETED")
      .reduce((total, payment) => total + payment.amount, 0);
  };

  const getPendingAmount = () => {
    return payments
      .filter((payment) => payment.status === "PENDING")
      .reduce((total, payment) => total + payment.amount, 0);
  };

  const getFailedAmount = () => {
    return payments
      .filter((payment) => payment.status === "FAILED")
      .reduce((total, payment) => total + payment.amount, 0);
  };

  return (
    <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 border-gray-200 dark:border-gray-700 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
          <CreditCard className="h-5 w-5" />
          <span>Payment History</span>
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800">
            {payments.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Payment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg backdrop-blur-lg bg-white/50 dark:bg-gray-800/50">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Total Completed
              </span>
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(getTotalAmount(), "USD")}
            </p>
          </div>

          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg backdrop-blur-lg bg-white/50 dark:bg-gray-800/50">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Pending
              </span>
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(getPendingAmount(), "USD")}
            </p>
          </div>

          <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg backdrop-blur-lg bg-white/50 dark:bg-gray-800/50">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Failed
              </span>
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatCurrency(getFailedAmount(), "USD")}
            </p>
          </div>
        </div>

        {/* Payment List */}
        <div className="space-y-4">
          {payments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                No payments found
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                No payment history for this admin
              </p>
            </div>
          ) : (
            payments.map((payment) => (
              <div
                key={payment._id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg backdrop-blur-lg bg-white/50 dark:bg-gray-800/50 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-200"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {payment.description || "Payment"}
                      </h4>
                      <Badge className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                      <Badge className={getMethodColor(payment.method)}>
                        {payment.method}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(payment.createdAt)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(payment.createdAt)}</span>
                      </div>
                      {payment.transactionId && (
                        <span className="text-gray-400 dark:text-gray-500">
                          ID: {payment.transactionId.slice(0, 8)}...
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(payment.amount, payment.currency)}
                  </p>
                  {payment.status === "PENDING" && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      Processing...
                    </p>
                  )}
                  {payment.status === "FAILED" && (
                    <p className="text-xs text-red-600 dark:text-red-400">
                      Failed
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
