// src/components/dashboardComponents/LoadingState.tsx
"use client";

import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading,
  children,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return <>{children}</>;
};

export default LoadingState;
