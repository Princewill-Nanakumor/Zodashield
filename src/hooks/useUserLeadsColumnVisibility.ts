// src/hooks/useUserLeadsColumnVisibility.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { UserLeadsColumnId } from "./useUserLeadsColumnOrder";

const USER_LEADS_COLUMN_VISIBILITY_STORAGE_KEY = "user-leads-table-column-visibility";

interface ColumnVisibilityState {
  [key: string]: boolean;
}

export const useUserLeadsColumnVisibility = () => {
  const [columnVisibility, setColumnVisibilityState] = useState<ColumnVisibilityState>(() => {
    if (typeof window === "undefined") return {};
    
    try {
      const saved = localStorage.getItem(USER_LEADS_COLUMN_VISIBILITY_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed || {};
      }
    } catch (error) {
      console.error("Error loading user leads column visibility from localStorage:", error);
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem(USER_LEADS_COLUMN_VISIBILITY_STORAGE_KEY, JSON.stringify(columnVisibility));
    } catch (error) {
      console.error("Error saving user leads column visibility to localStorage:", error);
    }
  }, [columnVisibility]);

  const setColumnVisibility = useCallback((columnId: UserLeadsColumnId, isVisible: boolean) => {
    setColumnVisibilityState((prev) => ({
      ...prev,
      [columnId]: isVisible,
    }));
  }, []);

  const isColumnVisible = useCallback((columnId: UserLeadsColumnId): boolean => {
    // Actions column is always visible
    if (columnId === "actions") return true;
    // If not in visibility state, default to visible
    return columnVisibility[columnId] !== false;
  }, [columnVisibility]);

  const toggleColumnVisibility = useCallback((columnId: UserLeadsColumnId) => {
    if (columnId === "actions") return; // Can't hide actions
    setColumnVisibility(columnId, !isColumnVisible(columnId));
  }, [isColumnVisible, setColumnVisibility]);

  const showAllColumns = useCallback(() => {
    setColumnVisibilityState({});
  }, []);

  return {
    columnVisibility,
    setColumnVisibility,
    isColumnVisible,
    toggleColumnVisibility,
    showAllColumns,
  };
};

