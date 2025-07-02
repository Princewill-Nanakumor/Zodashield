"use client";

import { use } from "react";

import { NewPasswordForm } from "@/components/authComponents/NewPasswordForm";

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
      <NewPasswordForm token={resolvedParams.token} />
    </div>
  );
}
