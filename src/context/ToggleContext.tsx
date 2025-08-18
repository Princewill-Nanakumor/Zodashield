// src/context/ToggleContext.tsx
"use client";

import { createContext, useContext } from "react";

// Create context for toggle state
interface ToggleContextType {
  showHeader: boolean;
  showControls: boolean;
  setShowHeader: (show: boolean) => void;
  setShowControls: (show: boolean) => void;
}

const ToggleContext = createContext<ToggleContextType | null>(null);

export const useToggleContext = () => {
  const context = useContext(ToggleContext);
  if (!context) {
    // Return default values when not in a toggle context (for non-leads pages)
    return {
      showHeader: true,
      showControls: true,
      setShowHeader: () => {},
      setShowControls: () => {},
    };
  }
  return context;
};

export const ToggleProvider = ToggleContext.Provider;
