// src/contexts/StatusContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Status } from "@/types/leads";
import { useSession } from "next-auth/react";

interface StatusContextType {
  statuses: Status[];
  isLoading: boolean;
  error: Error | null;
  refreshStatuses: () => Promise<void>;
}

const StatusContext = createContext<StatusContextType>({
  statuses: [],
  isLoading: true,
  error: null,
  refreshStatuses: async () => {},
});

export const useStatuses = () => useContext(StatusContext);

let cachedStatuses: Status[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function StatusProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatuses = useCallback(
    async (force = false) => {
      // Don't fetch if user is not authenticated
      if (status === "unauthenticated") {
        setStatuses([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      // Don't fetch if still loading session
      if (status === "loading") {
        return;
      }

      try {
        // Check memory cache first
        if (
          !force &&
          cachedStatuses &&
          cacheTimestamp &&
          Date.now() - cacheTimestamp < CACHE_DURATION
        ) {
          setStatuses(cachedStatuses);
          setIsLoading(false);
          return;
        }

        const response = await fetch("/api/statuses", {
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          // Handle 401 Unauthorized gracefully
          if (response.status === 401) {
            setStatuses([]); // Clear statuses
            setError(null); // Do NOT show error to user
            setIsLoading(false);
            return;
          }
          // For other errors, show error
          console.error(
            `Failed to fetch statuses. Status: ${response.status} ${response.statusText}. Body: ${errorText}`
          );
          throw new Error(
            `Failed to fetch statuses (HTTP ${response.status} ${response.statusText})`
          );
        }

        const data = await response.json();

        // Add NEW status if it doesn't exist - FIX: Use "NEW" as both _id and name
        const hasNewStatus = data.some(
          (status: Status) => status.name === "NEW"
        );
        if (!hasNewStatus) {
          data.unshift({
            _id: "NEW",
            name: "NEW", // Changed from "New" to "NEW" to match your leads
            color: "#3B82F6",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        // Update memory cache
        cachedStatuses = data;
        cacheTimestamp = Date.now();

        setStatuses(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        console.error("Error fetching statuses:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [status]
  );

  useEffect(() => {
    fetchStatuses();

    // Cleanup function
    return () => {
      cachedStatuses = null;
      cacheTimestamp = null;
    };
  }, [fetchStatuses]);

  const contextValue = {
    statuses,
    isLoading,
    error,
    refreshStatuses: () => fetchStatuses(true),
  };

  return (
    <StatusContext.Provider value={contextValue}>
      {children}
    </StatusContext.Provider>
  );
}
