// src/components/ui/RefetchIndicator.tsx
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface RefetchIndicatorProps {
  className?: string;
}

export const RefetchIndicator = ({ className = "" }: RefetchIndicatorProps) => {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();

  const isActive = isFetching > 0 || isMutating > 0;

  if (!isActive) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 text-white px-3 py-2 rounded-md shadow-lg flex items-center gap-2 ${className}`}
    >
      <Loader2 className="h-4 w-4 animate-spin" />
    </div>
  );
};
