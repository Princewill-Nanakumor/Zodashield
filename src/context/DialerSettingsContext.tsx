"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

type DialerType = "zoiper" | "microsip" | null;

type DialerSettings = {
  dialer: DialerType;
  setDialer: (dialer: DialerType) => void;
};

const DialerSettingsContext = createContext<DialerSettings>({
  dialer: null,
  setDialer: () => {},
});

export function useDialerSettings() {
  return useContext(DialerSettingsContext);
}

export function DialerSettingsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dialer, setDialer] = useState<DialerType>(null);

  // Load from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedDialer = localStorage.getItem("dialer");
      // If no value exists in localStorage, default stays as null (disabled)
      // Only set if a valid dialer is saved
      if (savedDialer === "zoiper" || savedDialer === "microsip") {
        setDialer(savedDialer);
      }
      // If savedDialer is null, empty, or any other value, keep default as null
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (dialer === null) {
        localStorage.removeItem("dialer");
      } else {
        localStorage.setItem("dialer", dialer);
      }
    }
  }, [dialer]);

  return (
    <DialerSettingsContext.Provider
      value={{
        dialer,
        setDialer,
      }}
    >
      {children}
    </DialerSettingsContext.Provider>
  );
}

