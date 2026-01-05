"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
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

const cachedStatusesMap = new Map<string, Status>();
let cacheTimestamp: number | null = null;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export function StatusProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatuses = useCallback(
    async (force = false) => {
      if (status === "unauthenticated") {
        setStatuses([]);
        setIsLoading(false);
        setError(null);
        cachedStatusesMap.clear();
        cacheTimestamp = null;
        return;
      }

      if (status === "loading") {
        return;
      }

      try {
        if (
          !force &&
          cachedStatusesMap.size > 0 &&
          cacheTimestamp &&
          Date.now() - cacheTimestamp < CACHE_DURATION
        ) {
          setStatuses(Array.from(cachedStatusesMap.values()));
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
          if (response.status === 401) {
            setStatuses([]);
            setError(null);
            setIsLoading(false);
            cachedStatusesMap.clear();
            cacheTimestamp = null;
            return;
          }
          throw new Error(`Failed to fetch statuses (HTTP ${response.status})`);
        }

        const data: Status[] = await response.json();

        const hasNewStatus = data.some(
          (status: Status) => status.name === "New" || status.name === "NEW" || status._id === "NEW"
        );
        if (!hasNewStatus) {
          data.unshift({
            id: "NEW",
            _id: "NEW",
            name: "New",
            color: "#3B82F6",
            adminId: "system",
            createdBy: "system",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }

        cachedStatusesMap.clear();
        data.forEach((status) => {
          cachedStatusesMap.set(status._id || status.id, status);
        });
        cacheTimestamp = Date.now();

        setStatuses(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        cachedStatusesMap.clear();
        cacheTimestamp = null;
      } finally {
        setIsLoading(false);
      }
    },
    [status]
  );

  useEffect(() => {
    fetchStatuses();
    return () => {
      cachedStatusesMap.clear();
      cacheTimestamp = null;
    };
  }, [fetchStatuses]);

  useEffect(() => {
    if (status === "unauthenticated") {
      cachedStatusesMap.clear();
      cacheTimestamp = null;
    }
  }, [status]);

  const contextValue = useMemo(
    () => ({
      statuses,
      isLoading,
      error,
      refreshStatuses: () => fetchStatuses(true),
    }),
    [statuses, isLoading, error, fetchStatuses]
  );

  return (
    <StatusContext.Provider value={contextValue}>
      {children}
    </StatusContext.Provider>
  );
}
