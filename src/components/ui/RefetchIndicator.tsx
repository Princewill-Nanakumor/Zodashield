// src/components/ui/RefetchIndicator.tsx
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export const RefetchIndicator = () => {
  const [isRefetching, setIsRefetching] = useState(false);

  useEffect(() => {
    const handleRefetch = () => {
      setIsRefetching(true);
      setTimeout(() => setIsRefetching(false), 2000);
    };

    // Listen for query refetch events
    window.addEventListener("query-refetch", handleRefetch);

    return () => {
      window.removeEventListener("query-refetch", handleRefetch);
    };
  }, []);

  if (!isRefetching) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-blue-500 text-white px-3 py-2 rounded-md shadow-lg flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm">Updating...</span>
    </div>
  );
};
