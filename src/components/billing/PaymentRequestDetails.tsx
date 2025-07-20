// src/components/billing/PaymentRequestDetails.tsx

"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  ExternalLink,
  Info,
  CheckCircle,
  ArrowLeft,
  Clock,
} from "lucide-react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";

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

interface PaymentRequestDetailsProps {
  currentPayment: CurrentPayment;
  network: "TRC20" | "ERC20";
  paymentConfirmed: boolean;
  onConfirmPayment: () => void;
  onShowPaymentDetails: () => void;
  onBackToDeposit: () => void;
}

export default function PaymentRequestDetails({
  currentPayment,
  network,
  paymentConfirmed,
  onConfirmPayment,
  onShowPaymentDetails,
  onBackToDeposit,
}: PaymentRequestDetailsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleBackToDeposit = () => {
    // Clear localStorage
    localStorage.removeItem("currentPayment");
    localStorage.removeItem("paymentNetwork");
    localStorage.removeItem("paymentConfirmed");

    // Call the parent handler
    onBackToDeposit();
  };

  // Show confirmation screen after user clicks "I Have Made the Payment"
  if (paymentConfirmed) {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center mb-4">
            <Clock className="h-6 w-6 text-blue-600 mr-3" />
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 text-lg">
              Payment Confirmation Submitted
            </h3>
          </div>

          <div className="space-y-3 mb-6">
            <p className="text-blue-700 dark:text-blue-300">
              Thank you for confirming your payment. We are now verifying your
              transaction on the blockchain.
            </p>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Payment ID:
                  </span>
                  <p className="font-mono text-gray-900 dark:text-white">
                    {currentPayment.transactionId}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Amount:
                  </span>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {currentPayment.amount} USDT
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Network:
                  </span>
                  <p className="text-gray-900 dark:text-white">{network}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">
                    Status:
                  </span>
                  <p className="text-yellow-600 dark:text-yellow-400 font-medium flex gap-1">
                    <Clock className="h-5 w-5 text-yellow-600 animate-spin" />
                    PENDING
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start">
                <Info className="h-4 w-4 mt-0.5 mr-2 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 text-sm">
                    What happens next?
                  </h4>
                  <ul className="text-yellow-700 dark:text-yellow-300 text-xs mt-1 space-y-1">
                    <li>
                      • We&apos;ll verify your transaction on the blockchain
                    </li>
                    <li>
                      • Processing time:{" "}
                      {network === "TRC20" ? "1-2 minutes" : "5-10 minutes"}
                    </li>
                    <li>• You&apos;ll receive a notification when verified</li>
                    <li>• Funds will be added to your account balance</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onShowPaymentDetails} className="flex-1">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Payment Details
            </Button>

            <Button
              onClick={handleBackToDeposit}
              variant="outline"
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Deposit
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show the original payment request screen
  return (
    <div className="space-y-6">
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
        <div className="flex items-center mb-3">
          <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
          <h3 className="font-semibold text-green-800 dark:text-green-200">
            Payment Request Created
          </h3>
        </div>
        <p className="text-green-700 dark:text-green-300 text-sm mb-4">
          Please send exactly{" "}
          <span className="font-bold">{currentPayment.amount} USDT</span> to the
          wallet address below. After making payment, click on&quot; I have made
          the payment&quot;
        </p>

        {currentPayment.walletAddress ? (
          <>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium dark:text-gray-300 text-gray-700">
                  {network} Deposit Address
                </span>
                <Button
                  onClick={() => handleCopy(currentPayment.walletAddress!)}
                  className="flex items-center text-sm text-purple-600 hover:bg-gray-200 hover:dark:bg-gray-800 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 bg-transparent p-0"
                >
                  {copied ? (
                    <>
                      <Check className="mr-1 h-4 w-4" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-4 w-4" /> Copy
                    </>
                  )}
                </Button>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <QRCode
                    value={currentPayment.walletAddress}
                    size={128}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="Q"
                  />
                </div>

                <div className="flex-1 w-full">
                  <div className="font-mono text-sm dark:bg-white/5 bg-gray-100 px-4 py-3 rounded-lg break-all dark:text-white text-gray-900">
                    {currentPayment.walletAddress}
                  </div>

                  <div className="mt-3 flex items-center text-xs dark:text-gray-400 text-gray-500">
                    <Info className="mr-1 h-4 w-4" />
                    <span>
                      {network === "TRC20"
                        ? "Only send TRC20 USDT to this address (Tron network)"
                        : "Only send ERC20 USDT to this address (Ethereum network)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800 mb-4">
              <div className="flex items-start">
                <Info className="h-4 w-4 mt-0.5 mr-2 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 text-sm">
                    Important Notice
                  </h4>
                  <p className="text-yellow-700 dark:text-yellow-300 text-xs">
                    {network === "TRC20"
                      ? "TRC20 deposits are faster and have lower fees (~1 USDT) compared to ERC20"
                      : "ERC20 deposits may take longer and have higher gas fees (varies)"}
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <a
                href={
                  network === "TRC20"
                    ? `https://tronscan.org/#/address/${currentPayment.walletAddress}`
                    : `https://etherscan.io/address/${currentPayment.walletAddress}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-purple-600 dark:text-purple-400 hover:underline"
              >
                View on {network === "TRC20" ? "Tronscan" : "Etherscan"}{" "}
                <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </div>
          </>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-4">
            <div className="flex items-start">
              <Info className="h-4 w-4 mt-0.5 mr-2 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-800 dark:text-blue-200 text-sm">
                  Payment Created Successfully
                </h4>
                <p className="text-blue-700 dark:text-blue-300 text-xs">
                  Payment ID: {currentPayment.transactionId}
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-xs">
                  Amount: {currentPayment.amount} {currentPayment.currency}
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-xs">
                  Status: {currentPayment.status}
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-xs">
                  Network: {currentPayment.network}
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-xs mt-2">
                  ⚠️ No wallet address provided by API
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onConfirmPayment}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white mt-2"
          >
            <CheckCircle className="h-4 w-4 mr-2" />I Have Made the Payment
          </Button>
        </div>
      </div>
    </div>
  );
}
