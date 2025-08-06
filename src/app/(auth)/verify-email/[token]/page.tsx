// src/app/verify-email/[token]/page.tsx
"use client";

import { Suspense } from "react";
import React from "react";
import { VerifyEmailContent } from "@/components/authComponents/VerifyEmailContent";
function VerifyEmailWrapper({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = React.use(params);

  return <VerifyEmailContent token={resolvedParams.token} />;
}

export default function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 md:p-8">
          <div className="text-center">
            <div className="relative w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <div className="absolute inset-0 border-4 border-transparent border-t-indigo-400 border-r-purple-500 rounded-full animate-spin w-16 h-16"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Loading verification page...
            </p>
          </div>
        </div>
      }
    >
      <VerifyEmailWrapper params={params} />
    </Suspense>
  );
}
