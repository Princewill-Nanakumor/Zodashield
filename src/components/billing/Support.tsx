"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface SupportProps {
  title?: string;
  description?: string;
  buttonText?: string;
  onContactSupport?: () => void;
}

export default function Support({
  title = "Need Help?",
  description = "Contact our support team if you encounter any issues or have questions about the deposit process.",
  buttonText = "Contact Support",
  onContactSupport,
}: SupportProps) {
  const handleContactSupport = () => {
    if (onContactSupport) {
      onContactSupport();
    } else {
      // Default behavior - you can customize this
      window.open("support@zohashield", "_blank");
    }
  };

  return (
    <div className="dark:backdrop-blur-lg dark:bg-white/5 rounded-2xl p-6 shadow-lg dark:border dark:border-white/10 bg-white border border-gray-200">
      <h3 className="text-lg font-semibold dark:text-white text-gray-900 mb-4">
        {title}
      </h3>

      <p className="dark:text-gray-300 text-gray-600 text-sm mb-4">
        {description}
      </p>

      <Button
        onClick={handleContactSupport}
        className="w-full dark:bg-transparent dark:hover:bg-white/10 dark:border dark:border-white/20 dark:text-white bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300"
      >
        {buttonText}
      </Button>
    </div>
  );
}
