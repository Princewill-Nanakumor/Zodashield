// src/hooks/useColumnOrder.ts
"use client";

import { useState, useCallback } from "react";
import { ColumnOrderState } from "@tanstack/react-table";

const COLUMN_ORDER_STORAGE_KEY = "all-leads-table-column-order";

const DEFAULT_COLUMN_ORDER: ColumnOrderState = [
  "select",
  "actions",
  "leadId",
  "name",
  "email",
  "phone",
  "country",
  "status",
  "source",
  "assignedTo",
  "createdAt",
  "lastComment",
  "lastCommentDate",
  "commentCount",
];

export const useColumnOrder = () => {
  const [columnOrder, setColumnOrderState] = useState<ColumnOrderState>(() => {
    if (typeof window === "undefined") return DEFAULT_COLUMN_ORDER;
    
    try {
      const saved = localStorage.getItem(COLUMN_ORDER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Validate that all default columns are present
        const savedOrder = Array.isArray(parsed) ? parsed : DEFAULT_COLUMN_ORDER;
        // Merge saved order with default to ensure all columns are present
        const allColumns = [...new Set([...savedOrder, ...DEFAULT_COLUMN_ORDER])];
        return allColumns.filter((col) => DEFAULT_COLUMN_ORDER.includes(col));
      }
    } catch (error) {
      console.error("Error loading column order from localStorage:", error);
    }
    return DEFAULT_COLUMN_ORDER;
  });

  const setColumnOrder = useCallback((updater: ColumnOrderState | ((prev: ColumnOrderState) => ColumnOrderState)) => {
    setColumnOrderState((prev) => {
      const newOrder = typeof updater === "function" ? updater(prev) : updater;
      
      // Save to localStorage
      try {
        localStorage.setItem(COLUMN_ORDER_STORAGE_KEY, JSON.stringify(newOrder));
      } catch (error) {
        console.error("Error saving column order to localStorage:", error);
      }
      
      return newOrder;
    });
  }, []);

  return {
    columnOrder,
    setColumnOrder,
  };
};

