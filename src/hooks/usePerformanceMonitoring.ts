// hooks/usePerformanceMonitoring.ts
"use client";

import { useEffect, useCallback } from "react";

// Remove the duplicate global declaration since it should be defined elsewhere
// If you need it, create it in a separate types file to avoid conflicts

interface WebVitalMetric {
  name: string;
  value: number;
  id: string;
  delta: number;
  entries: PerformanceEntry[];
  navigationType: string;
  rating: "good" | "needs-improvement" | "poor";
}

// Define gtag parameters interface for type safety
interface GtagEventParameters {
  event_category?: string;
  event_action?: string;
  event_value?: number;
  custom_map?: Record<string, string>;
  [key: string]: string | number | boolean | Record<string, string> | undefined;
}

// Type-safe gtag function wrapper
function safeGtag(
  command: string,
  eventName: string,
  parameters: GtagEventParameters
): void {
  if (
    typeof window !== "undefined" &&
    "gtag" in window &&
    typeof window.gtag === "function"
  ) {
    // Type assertion to work with existing gtag function
    (
      window.gtag as (
        command: string,
        eventName: string,
        parameters: GtagEventParameters
      ) => void
    )(command, eventName, parameters);
  }
}

export const usePerformanceMonitoring = () => {
  // Helper function to determine metric rating
  const getMetricRating = useCallback(
    (name: string, value: number): "good" | "needs-improvement" | "poor" => {
      switch (name) {
        case "LCP":
          return value <= 2500
            ? "good"
            : value <= 4000
              ? "needs-improvement"
              : "poor";
        case "INP":
          return value <= 200
            ? "good"
            : value <= 500
              ? "needs-improvement"
              : "poor";
        case "CLS":
          return value <= 0.1
            ? "good"
            : value <= 0.25
              ? "needs-improvement"
              : "poor";
        case "FCP":
          return value <= 1800
            ? "good"
            : value <= 3000
              ? "needs-improvement"
              : "poor";
        case "TTFB":
          return value <= 800
            ? "good"
            : value <= 1800
              ? "needs-improvement"
              : "poor";
        default:
          return "good";
      }
    },
    []
  );

  // Helper function to format console output (disabled in production)
  const logMetric = useCallback(
    (metric: WebVitalMetric) => {
      // Only log in development
      if (process.env.NODE_ENV === "development") {
        const rating = getMetricRating(metric.name, metric.value);
        const emoji =
          rating === "good"
            ? "🟢"
            : rating === "needs-improvement"
              ? "🟡"
              : "🔴";

        if (metric.name === "CLS") {
          console.log(
            `${emoji} ${metric.name}: ${metric.value.toFixed(3)} (${rating})`
          );
        } else {
          console.log(
            `${emoji} ${metric.name}: ${Math.round(metric.value)}ms (${rating})`
          );
        }
      }
    },
    [getMetricRating]
  );

  // Helper function to send to analytics
  const sendToAnalytics = useCallback(
    (metric: WebVitalMetric) => {
      try {
        // Send to Google Analytics if available
        if (typeof window !== "undefined") {
          safeGtag("event", "web_vitals", {
            event_category: "Web Vitals",
            event_action: metric.name,
            event_value: Math.round(
              metric.name === "CLS" ? metric.value * 1000 : metric.value
            ),
            custom_map: {
              metric_id: metric.id,
              metric_rating: getMetricRating(metric.name, metric.value),
            },
          });
        }

        // Send to your custom analytics endpoint
        if (typeof window !== "undefined") {
          fetch("/api/analytics/web-vitals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: metric.name,
              value: metric.value,
              id: metric.id,
              delta: metric.delta,
              rating: getMetricRating(metric.name, metric.value),
              url: window.location.href,
              timestamp: Date.now(),
              userAgent: navigator.userAgent,
            }),
          }).catch((error: Error) => {
            console.error("Failed to send web vital to analytics:", error);
          });
        }
      } catch (error) {
        console.error("Error in sendToAnalytics:", error);
      }
    },
    [getMetricRating]
  );

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    let isLoaded = false;

    const loadWebVitals = async (): Promise<void> => {
      if (isLoaded) return;
      isLoaded = true;

      try {
        const { onCLS, onFCP, onLCP, onTTFB, onINP } = await import(
          "web-vitals"
        );

        // Track Largest Contentful Paint
        onLCP((metric) => {
          logMetric(metric);
          sendToAnalytics(metric);
        });

        // Track Interaction to Next Paint
        onINP((metric) => {
          logMetric(metric);
          sendToAnalytics(metric);
        });

        // Track Cumulative Layout Shift
        onCLS((metric) => {
          logMetric(metric);
          sendToAnalytics(metric);
        });

        // Track First Contentful Paint
        onFCP((metric) => {
          logMetric(metric);
          sendToAnalytics(metric);
        });

        // Track Time to First Byte
        onTTFB((metric) => {
          logMetric(metric);
          sendToAnalytics(metric);
        });
      } catch (error) {
        console.error("Failed to load web-vitals library:", error);
      }
    };

    // Load web vitals after a short delay to not block initial render
    const timeoutId = setTimeout(loadWebVitals, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [logMetric, sendToAnalytics]);

  // Return performance summary function for debugging (only in development)
  return useCallback((): void => {
    if (typeof window === "undefined" || process.env.NODE_ENV !== "development")
      return;

    const navigation = performance.getEntriesByType(
      "navigation"
    )[0] as PerformanceNavigationTiming;
    if (navigation) {
      console.log("📊 Current Performance Summary:");
      console.log(
        `   DOM Content Loaded: ${Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart)}ms`
      );
      console.log(
        `   Page Load Complete: ${Math.round(navigation.loadEventEnd - navigation.fetchStart)}ms`
      );
      console.log(
        `   DNS Lookup: ${Math.round(navigation.domainLookupEnd - navigation.domainLookupStart)}ms`
      );
      console.log(
        `   TCP Connection: ${Math.round(navigation.connectEnd - navigation.connectStart)}ms`
      );
      console.log(
        `   Server Response: ${Math.round(navigation.responseEnd - navigation.requestStart)}ms`
      );
    }
  }, []);
};

// Performance data interface
interface PerformanceData {
  domContentLoaded: number;
  pageLoad: number;
  dnsLookup: number;
  tcpConnection: number;
  serverResponse: number;
  ttfb: number;
}

// Export a hook for getting performance data
export const usePerformanceData = () => {
  const getPerformanceData = useCallback((): PerformanceData | null => {
    if (typeof window === "undefined") return null;

    const navigation = performance.getEntriesByType(
      "navigation"
    )[0] as PerformanceNavigationTiming;
    if (!navigation) return null;

    return {
      domContentLoaded: Math.round(
        navigation.domContentLoadedEventEnd - navigation.fetchStart
      ),
      pageLoad: Math.round(navigation.loadEventEnd - navigation.fetchStart),
      dnsLookup: Math.round(
        navigation.domainLookupEnd - navigation.domainLookupStart
      ),
      tcpConnection: Math.round(
        navigation.connectEnd - navigation.connectStart
      ),
      serverResponse: Math.round(
        navigation.responseEnd - navigation.requestStart
      ),
      ttfb: Math.round(navigation.responseStart - navigation.fetchStart),
    };
  }, []);

  return { getPerformanceData };
};
