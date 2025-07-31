// app/verify-email/[token]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import React from "react";
import { Inter } from "next/font/google";
import { Shield, CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export default function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const router = useRouter();
  const resolvedParams = React.use(params);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: resolvedParams.token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "Email verified successfully!");
          // Redirect to login after successful verification
          setTimeout(() => {
            router.push("/login");
          }, 5000);
        } else {
          setStatus("error");
          setMessage(data.message || "Failed to verify email");
        }
      } catch (err) {
        console.error("Verification error:", err);
        setStatus("error");
        setMessage("An error occurred while verifying your email.");
      }
    };

    verifyEmail();
  }, [resolvedParams.token, router]);

  return (
    <div
      className={`min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 ${inter.className}`}
    >
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg px-3 sm:px-4 py-4 sm:py-6">
        {/* Logo Section */}
        <div className="text-center mb-6 sm:mb-8">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4"
          >
            <div className="p-1.5 sm:p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-md">
              <Shield
                size={28}
                className="sm:w-[35px] sm:h-[35px] text-white"
              />
            </div>
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              ZodaShield
            </div>
          </Link>
        </div>

        {/* Verification Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Email Verification
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 mt-2">
              Verifying your email address...
            </p>
          </div>

          <div className="flex items-center justify-center w-full">
            {status === "loading" && (
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-transparent border-t-indigo-400 border-r-purple-500 rounded-full animate-spin w-16 h-16"></div>
                  <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600">
                    <Loader2 size={24} className="text-white animate-spin" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Verifying your email...
                </p>
              </div>
            )}

            {status === "success" && (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">
                    Email Verified!
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {message}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Redirecting to login in 5 seconds...
                  </p>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">
                    Verification Failed
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {message}
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-colors"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
