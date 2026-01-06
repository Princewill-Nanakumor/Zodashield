// src/components/dashboardComponents/filters/SourceFilter.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Lead } from "@/types/leads";
import { MultiSelectFilter } from "./MultiSelectFilter";

interface SourceFilterProps {
  value: string[]; // Changed to array
  onChange: (values: string[]) => void; // Changed to array
  disabled: boolean;
  isLoading?: boolean;
  mode?: "include" | "exclude"; // Filter mode
  onModeChange?: (mode: "include" | "exclude") => void; // Mode change handler
}

export const SourceFilter = ({
  value = [],
  onChange,
  disabled,
  isLoading = false,
  mode: externalMode,
  onModeChange,
}: SourceFilterProps) => {
  // Internal mode state if not controlled externally
  const [internalMode, setInternalMode] = useState<"include" | "exclude">(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sourceFilterMode");
      return (stored === "exclude" ? "exclude" : "include") as "include" | "exclude";
    }
    return "include";
  });

  const mode = externalMode ?? internalMode;

  // Save mode to localStorage when it changes and dispatch custom event
  useEffect(() => {
    if (typeof window !== "undefined" && !externalMode) {
      localStorage.setItem("sourceFilterMode", mode);
      // Dispatch custom event for immediate sync (same-tab)
      window.dispatchEvent(new CustomEvent("sourceFilterModeChanged"));
    }
  }, [mode, externalMode]);

  const handleModeToggle = () => {
    const newMode = mode === "include" ? "exclude" : "include";
    if (onModeChange) {
      onModeChange(newMode);
    } else {
      setInternalMode(newMode);
    }
  };
  // ✅ FIX: Use useQuery to subscribe to cache updates
  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ["leads"],
    queryFn: async () => {
      const response = await fetch("/api/leads/all", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch leads");
      return response.json();
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  });

  // Extract unique sources from leads
  const sources = useMemo(() => {
    return [
      ...new Set(
        leads
          .map((lead: Lead) => lead.source)
          .filter((source) => source && source.trim() !== "" && source !== "-" && source !== "—")
      ),
    ].sort();
  }, [leads]);

  const options = useMemo(
    () =>
      sources.map((source: string) => ({
        value: source,
        label: source,
      })),
    [sources]
  );

  const getPlaceholder = () => {
    if (value.length === 0) {
      return "All Sources";
    }
    if (mode === "exclude") {
      return `Hide ${value.length} ${value.length === 1 ? "source" : "sources"}`;
    }
    return `Show ${value.length} ${value.length === 1 ? "source" : "sources"}`;
  };

  return (
    <MultiSelectFilter
      value={value}
      onChange={onChange}
      options={options}
      placeholder={getPlaceholder()}
      disabled={disabled}
      isLoading={isLoading}
      mode={mode}
      onModeChange={handleModeToggle}
    />
  );
};
