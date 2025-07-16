"use client";

import React, { useEffect, useState } from "react";
import { Copy, Check, ExternalLink, Info } from "lucide-react";
import QRCode from "react-qr-code";

const USDT_ADDRESS = "TNPZvdnJQjQf4zWkdt3R5ZQ7j5q5J5X5vJ"; // Example TRC20 address
const MIN_DEPOSIT = 10;
const NETWORK_FEE = 1;

export default function BillingManager() {
  const [amount, setAmount] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState("usdt");
  const [countdown, setCountdown] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [network, setNetwork] = useState<"TRC20" | "ERC20">("TRC20");

  const handleCopy = () => {
    navigator.clipboard.writeText(USDT_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseFloat(amount) < MIN_DEPOSIT) {
      alert(`Minimum deposit amount is ${MIN_DEPOSIT} USDT`);
      return;
    }
    setSubmitted(true);
    setCountdown(900);
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

  return (
    <div className="container mx-auto p-8 space-y-8 bg-background dark:bg-gray-800 rounded-md border max-w-2xl mt-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Billing & Fund Account
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Fund your account securely using USDT (Tether)
          </p>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab("usdt")}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${activeTab === "usdt" ? "bg-purple-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"}`}
          >
            Crypto
          </button>
          <button
            onClick={() => setActiveTab("card")}
            className={`px-4 py-2 mx-3 rounded-lg text-sm font-medium ${activeTab === "card" ? "bg-purple-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"}`}
          >
            Card Deposit
          </button>
        </div>
      </div>

      {/* USDT Deposit Section */}
      {activeTab === "usdt" ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-600 dark:text-gray-400">
              Deposit USDT (Tether) to your account. Please ensure you are
              sending funds through the{" "}
              <span className="font-semibold">{network}</span> network.
            </p>
            <button
              onClick={toggleNetwork}
              className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-md transition"
            >
              Switch to {network === "TRC20" ? "ERC20" : "TRC20"}
            </button>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {network} Deposit Address
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
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
              </button>
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
                <div className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-lg break-all">
                  {USDT_ADDRESS}
                </div>

                <div className="mt-3 flex items-center text-xs text-gray-500 dark:text-gray-400">
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
            onClick={() => setShowInstructions(!showInstructions)}
            className="text-sm text-purple-600 dark:text-purple-400 hover:underline mb-2"
          >
            {showInstructions ? "Hide" : "Show"} deposit instructions
          </button>

          {showInstructions && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 text-sm text-gray-700 dark:text-gray-300 mb-4">
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Deposit Amount (USDT)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={MIN_DEPOSIT}
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={`Minimum ${MIN_DEPOSIT} USDT`}
                  required
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>Minimum deposit: {MIN_DEPOSIT} USDT</span>
                <span>Network fee: {NETWORK_FEE} USDT</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition shadow-md"
            >
              Generate Deposit Request
            </button>
          </form>

          {submitted && (
            <div className="mt-6 p-5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-green-700 dark:text-green-300">
                  Deposit Instructions
                </h4>
                {countdown > 0 && (
                  <span className="text-sm font-mono bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded text-green-700 dark:text-green-300">
                    Expires in: {formatTime(countdown)}
                  </span>
                )}
              </div>

              <p className="text-green-700 dark:text-green-300 mb-3">
                Please send <span className="font-bold">{amount} USDT</span> to
                the address provided.
              </p>

              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
                <Info className="mr-1 h-4 w-4" />
                <span>This address is valid for 15 minutes</span>
              </div>

              <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500 dark:text-gray-400">
                    Amount:
                  </span>
                  <span className="font-medium">{amount} USDT</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500 dark:text-gray-400">
                    Network:
                  </span>
                  <span className="font-medium">{network}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Status:
                  </span>
                  <span className="font-medium text-yellow-600 dark:text-yellow-400">
                    Pending
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
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div className="bg-gray-100 dark:bg-gray-900 p-8 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              Card Deposit
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Coming soon. Please use USDT deposits for now.
            </p>
            <button
              onClick={() => setActiveTab("usdt")}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
            >
              Switch to USDT
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Need help with your deposit?
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Contact our support team if you encounter any issues or have questions
          about the deposit process.
        </p>
        <button className="text-sm px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition">
          Contact Support
        </button>
      </div>
    </div>
  );
}
