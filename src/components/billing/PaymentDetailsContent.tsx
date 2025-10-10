"use client";

import React from "react";
import { DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PaymentStatusCard from "./PaymentStatusCard";
import {
  getStatusColor,
  getMethodColor,
  formatCurrency,
  formatDate,
} from "./PaymentUtils";
import { Payment } from "@/types/payment.types";

interface PaymentDetailsContentProps {
  payment: Payment | null;
  onClose: () => void;
  onNewPayment: () => void;
}

export default function PaymentDetailsContent({
  payment,
  onClose,
  onNewPayment,
}: PaymentDetailsContentProps) {
  if (!payment) {
    return null;
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
        onCloseModal={onClose}
      />
    </div>
  );
}
