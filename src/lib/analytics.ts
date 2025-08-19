// lib/analytics.ts

// Web Vitals metric interface
interface WebVitalMetric {
  name: "CLS" | "FCP" | "LCP" | "TTFB" | "INP";
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  entries: PerformanceEntry[];
  id: string;
  navigationType: string;
}

// Enhanced metric with additional tracking data
interface EnhancedWebVitalMetric extends WebVitalMetric {
  timestamp: number;
  url: string;
  userAgent: string;
}

// Store for tracking if web vitals have been loaded
let isWebVitalsLoaded = false;

/**
 * Initialize web vitals tracking
 * Only loads the web-vitals library once per session
 */
export function trackWebVitals(): void {
  if (isWebVitalsLoaded) {
    console.log("Web vitals tracking already initialized");
    return;
  }

  // Check if we're in a browser environment
  if (typeof window === "undefined") {
    console.warn("trackWebVitals called on server side, skipping...");
    return;
  }

  isWebVitalsLoaded = true;

  // Dynamically import web-vitals library
  import("web-vitals")
    .then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      const sendToAnalytics = (metric: WebVitalMetric): void => {
        try {
          // Create enhanced metric with additional data
          const enhancedMetric: EnhancedWebVitalMetric = {
            ...metric,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
          };

          // Store metrics locally first for offline capability
          storeMetricLocally(enhancedMetric);

          // Send to your API
          sendMetricToAPI(metric);

          console.log("Web Vital tracked:", enhancedMetric);
        } catch (error) {
          console.error("Error tracking web vital:", error);
        }
      };

      // Register all web vitals listeners
      onCLS(sendToAnalytics);
      onFCP(sendToAnalytics);
      onLCP(sendToAnalytics);
      onTTFB(sendToAnalytics);
      onINP(sendToAnalytics);
    })
    .catch((error: Error) => {
      console.error("Failed to load web-vitals library:", error);
      isWebVitalsLoaded = false; // Reset flag on error
    });
}

/**
 * Store metric data locally in localStorage
 * @param metric - The enhanced web vital metric to store
 */
function storeMetricLocally(metric: EnhancedWebVitalMetric): void {
  if (!window.localStorage) {
    console.warn("localStorage not available, skipping local metric storage");
    return;
  }

  try {
    const existingMetrics = getStoredMetrics();
    const updatedMetrics = [...existingMetrics, metric];

    // Keep only last 100 metrics to prevent localStorage bloat
    const limitedMetrics = updatedMetrics.slice(-100);

    localStorage.setItem("webVitals", JSON.stringify(limitedMetrics));
  } catch (error) {
    console.error("Error storing metric locally:", error);
  }
}

/**
 * Send metric to analytics API
 * @param metric - The web vital metric to send
 */
function sendMetricToAPI(metric: WebVitalMetric): void {
  fetch("/api/analytics/web-vitals", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...metric,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    }),
  }).catch((error: Error) => {
    console.error("Failed to send metric to API:", error);
  });
}

/**
 * Get stored metrics from localStorage
 * @returns Array of stored web vital metrics
 */
export function getStoredMetrics(): EnhancedWebVitalMetric[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }

  try {
    const stored = localStorage.getItem("webVitals");
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading stored metrics:", error);
    return [];
  }
}

/**
 * Clear stored metrics from localStorage
 */
export function clearStoredMetrics(): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }

  try {
    localStorage.removeItem("webVitals");
    console.log("Stored web vitals metrics cleared");
  } catch (error) {
    console.error("Error clearing stored metrics:", error);
  }
}

/**
 * Get metrics summary for the current session
 * @returns Summary of web vital metrics
 */
export function getMetricsSummary(): {
  lcp?: number;
  fcp?: number;
  cls?: number;
  ttfb?: number;
  inp?: number;
  count: number;
} {
  const metrics = getStoredMetrics();
  const currentPageMetrics = metrics.filter(
    (m) => m.url === window.location.href
  );

  const summary = {
    count: currentPageMetrics.length,
    lcp: undefined as number | undefined,
    fcp: undefined as number | undefined,
    cls: undefined as number | undefined,
    ttfb: undefined as number | undefined,
    inp: undefined as number | undefined,
  };

  currentPageMetrics.forEach((metric) => {
    switch (metric.name) {
      case "LCP":
        summary.lcp = metric.value;
        break;
      case "FCP":
        summary.fcp = metric.value;
        break;
      case "CLS":
        summary.cls = metric.value;
        break;
      case "TTFB":
        summary.ttfb = metric.value;
        break;
      case "INP":
        summary.inp = metric.value;
        break;
    }
  });

  return summary;
}

/**
 * Reset the web vitals loading state (useful for testing)
 */
export function resetWebVitalsState(): void {
  isWebVitalsLoaded = false;
}

/**
 * Check if web vitals tracking is initialized
 * @returns True if web vitals tracking has been initialized
 */
export function isWebVitalsInitialized(): boolean {
  return isWebVitalsLoaded;
}
