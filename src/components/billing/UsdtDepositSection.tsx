"use client";

import React, { useState } from "react";
import { Copy, Check, ExternalLink, Info } from "lucide-react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";

const USDT_ADDRESS = "TNPZvdnJQjQf4zWkdt3R5ZQ7j5q5J5X5vJ";
const MIN_DEPOSIT = 10;

interface UsdtDepositSectionProps {
  network: "TRC20" | "ERC20";
  amount: string;
  isSubmitting: boolean;
  submitted: boolean;
  countdown: number;
  showInstructions: boolean;
  onNetworkToggle: () => void;
  onAmountChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onToggleInstructions: () => void;
  formatTime: (seconds: number) => string;
}

export default function UsdtDepositSection({
  network,
  amount,
  isSubmitting,
  submitted,
  countdown,
  showInstructions,
  onNetworkToggle,
  onAmountChange,
  onSubmit,
  onToggleInstructions,
  formatTime,
}: UsdtDepositSectionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(USDT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <p className="dark:text-gray-300 text-gray-600 ">
          Deposit USDT (Tether) to your account. Please ensure you are sending
          funds through the <span className="font-semibold">{network}</span>{" "}
          network.
        </p>
        <Button
          onClick={onNetworkToggle}
          className="px-6 py-1 text-xs dark:bg-transparent dark:hover:bg-white/10 dark:border dark:border-white/20 dark:text-white bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300"
        >
          Switch to {network === "TRC20" ? "ERC20" : "TRC20"}
        </Button>
      </div>

      <div className="dark:bg-white/5 bg-gray-50 p-4 rounded-lg border border-gray-200 dark:border-white/10 mb-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-medium dark:text-gray-300 text-gray-700">
            {network} Deposit Address
          </span>
          <Button
            onClick={handleCopy}
            className="flex items-center text-sm text-purple-600  hover:bg-gray-200 hover:dark:bg-gray-800 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 bg-transparent p-0"
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
              value={USDT_ADDRESS}
              size={128}
              bgColor="#ffffff"
              fgColor="#000000"
              level="Q"
            />
          </div>

          <div className="flex-1 w-full">
            <div className="font-mono text-sm dark:bg-white/5 bg-gray-100 px-4 py-3 rounded-lg break-all dark:text-white text-gray-900">
              {USDT_ADDRESS}
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

      <button
        onClick={onToggleInstructions}
        className="text-sm text-purple-600 dark:text-purple-400 hover:underline mb-2 bg-transparent border-none p-0 cursor-pointer"
      >
        {showInstructions ? "Hide" : "Show"} deposit instructions
      </button>

      {showInstructions && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 text-sm dark:text-gray-300 text-gray-700 mb-4">
          <h4 className="font-medium mb-2">Deposit Instructions:</h4>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              Copy the {network} deposit address above or scan the QR code
            </li>
            <li>Open your wallet and initiate a USDT transfer</li>
            <li>
              Select the <strong>{network}</strong> network in your wallet
            </li>
            <li>Paste the deposit address and enter the amount</li>
            <li>Complete the transaction in your wallet</li>
            <li>
              Wait for blockchain confirmation (
              {network === "TRC20"
                ? "usually 1-2 minutes"
                : "usually 5-10 minutes"}
              )
            </li>
          </ol>
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium dark:text-gray-300 text-gray-700 mb-1">
            Deposit Amount (USDT)
          </label>
          <div className="relative">
            <input
              type="number"
              min={MIN_DEPOSIT}
              step="0.01"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              className="w-full pl-4 pr-4 py-3 border border-gray-300 dark:border-white/10 rounded-lg dark:bg-white/5 bg-gray-50 dark:text-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder={`Minimum ${MIN_DEPOSIT} USDT`}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="flex justify-between text-xs dark:text-gray-400 text-gray-500 mt-1">
            <span>Minimum deposit: {MIN_DEPOSIT} USDT</span>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating Payment..." : "Generate Deposit Request"}
        </Button>
      </form>

      {submitted && (
        <div className="mt-6 p-5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-green-700 dark:text-green-300">
              Payment Created Successfully!
            </h4>
            {countdown > 0 && (
              <span className="text-sm font-mono bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-green-700 dark:text-green-300">
                Redirecting in: {formatTime(countdown)}
              </span>
            )}
          </div>

          <p className="text-green-700 dark:text-green-300 mb-3">
            Your payment request has been created. Please send{" "}
            <span className="font-bold">{amount} USDT</span> to the address
            provided.
          </p>

          <div className="flex items-center text-sm dark:text-gray-400 text-gray-600 mb-3">
            <Info className="mr-1 h-4 w-4" />
            <span>You will be redirected to payment details shortly</span>
          </div>

          <div className="dark:bg-white/5 bg-white p-3 rounded border border-gray-200 dark:border-white/10 mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="dark:text-gray-400 text-gray-500">Amount:</span>
              <span className="font-medium">{amount} USDT</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="dark:text-gray-400 text-gray-500">Network:</span>
              <span className="font-medium">{network}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="dark:text-gray-400 text-gray-500">Status:</span>
              <span className="font-medium text-yellow-600 dark:text-yellow-400">
                Pending Approval
              </span>
            </div>
          </div>

          <a
            href={
              network === "TRC20"
                ? `https://tronscan.org/#/address/${USDT_ADDRESS}`
                : `https://etherscan.io/address/${USDT_ADDRESS}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-purple-600 dark:text-purple-400 hover:underline"
          >
            View on {network === "TRC20" ? "Tronscan" : "Etherscan"}{" "}
            <ExternalLink className="ml-1 h-4 w-4" />
          </a>
        </div>
      )}
    </div>
  );
}
