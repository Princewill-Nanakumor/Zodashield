// src/hooks/useBatchRefetch.ts
import { useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

export const useBatchRefetch = () => {
  const queryClient = useQueryClient();
  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingRefetches = useRef<Set<string>>(new Set());

  const batchRefetch = useCallback(
    (queryKey: string[]) => {
      // Clear existing timeout
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }

      // Add to pending refetches
      queryKey.forEach((key) => pendingRefetches.current.add(key));

      // Batch refetch after 100ms
      refetchTimeoutRef.current = setTimeout(() => {
        const queriesToRefetch = Array.from(pendingRefetches.current);
        console.log("🔄 Batch refetching queries:", queriesToRefetch);

        queryClient.invalidateQueries({
          queryKey: queriesToRefetch.map((key) => [key]),
        });

        pendingRefetches.current.clear();
      }, 100);
    },
    [queryClient]
  );

  return { batchRefetch };
};
