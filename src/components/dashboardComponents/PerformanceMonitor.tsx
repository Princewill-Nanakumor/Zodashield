// components/dashboardComponents/PerformanceMonitor.tsx
"use client";

import { usePerformanceMonitoring } from "@/hooks/usePerformanceMonitoring";
import { trackWebVitals } from "@/lib/analytics";
import { useEffect, ReactNode } from "react";

interface PerformanceMonitorProps {
  children: ReactNode;
}

export default function PerformanceMonitor({
  children,
}: PerformanceMonitorProps) {
  const logPerformance = usePerformanceMonitoring();

  useEffect(() => {
    // Initialize web vitals tracking
    trackWebVitals();

    // Log initial performance summary after page load
    const timer = setTimeout(() => {
      logPerformance();
    }, 2000);

    return () => clearTimeout(timer);
  }, [logPerformance]);

  // Return the children instead of null
  return <>{children}</>;
}
