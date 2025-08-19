// components/PerformanceDashboard.tsx
import { useState, useEffect, useCallback } from "react";

// Define interfaces for type safety
interface PerformanceMetrics {
  lcp: number;
  inp: number;
  ttfb: number;
  cls: number;
  errorRate: number;
  conversionRate: number;
}

interface MetricsState {
  before: PerformanceMetrics | null;
  after: PerformanceMetrics | null;
  loading: boolean;
}

interface ApiResponse {
  before: PerformanceMetrics;
  after: PerformanceMetrics;
}

interface MetricCardProps {
  title: string;
  before: number | undefined;
  after: number | undefined;
  unit: string;
  target: string;
  improvement: string;
}

type StatusColor = "gray" | "red" | "green";

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<MetricsState>({
    before: null,
    after: null,
    loading: true,
  });

  const fetchMetrics = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/analytics/summary");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      setMetrics({
        before: data.before,
        after: data.after,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
      setMetrics((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const calculateImprovement = useCallback(
    (
      before: number | undefined,
      after: number | undefined,
      isReverse: boolean = false
    ): string => {
      if (!before || !after || before === 0) return "N/A";

      const improvement = isReverse
        ? ((after - before) / before) * 100
        : ((before - after) / before) * 100;

      return improvement.toFixed(1) + "%";
    },
    []
  );

  if (metrics.loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2">Loading performance data...</span>
      </div>
    );
  }

  if (!metrics.before || !metrics.after) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600">
          Failed to load performance data. Please try again.
        </div>
        <button
          onClick={fetchMetrics}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="performance-dashboard max-w-7xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Performance Comparison: Before vs After
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          ZodaShield optimization results and Core Web Vitals improvements
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard
          title="Largest Contentful Paint (LCP)"
          before={metrics.before.lcp}
          after={metrics.after.lcp}
          unit="ms"
          target="< 2500ms"
          improvement={calculateImprovement(
            metrics.before.lcp,
            metrics.after.lcp
          )}
        />

        <MetricCard
          title="Interaction to Next Paint (INP)"
          before={metrics.before.inp}
          after={metrics.after.inp}
          unit="ms"
          target="< 200ms"
          improvement={calculateImprovement(
            metrics.before.inp,
            metrics.after.inp
          )}
        />

        <MetricCard
          title="Time to First Byte (TTFB)"
          before={metrics.before.ttfb}
          after={metrics.after.ttfb}
          unit="ms"
          target="< 800ms"
          improvement={calculateImprovement(
            metrics.before.ttfb,
            metrics.after.ttfb
          )}
        />

        <MetricCard
          title="Cumulative Layout Shift (CLS)"
          before={metrics.before.cls}
          after={metrics.after.cls}
          unit=""
          target="< 0.1"
          improvement={calculateImprovement(
            metrics.before.cls,
            metrics.after.cls
          )}
        />

        <MetricCard
          title="Error Rate"
          before={metrics.before.errorRate}
          after={metrics.after.errorRate}
          unit="%"
          target="< 1%"
          improvement={calculateImprovement(
            metrics.before.errorRate,
            metrics.after.errorRate
          )}
        />

        <MetricCard
          title="Conversion Rate"
          before={metrics.before.conversionRate}
          after={metrics.after.conversionRate}
          unit="%"
          target="> 2%"
          improvement={calculateImprovement(
            metrics.before.conversionRate,
            metrics.after.conversionRate,
            true
          )}
        />
      </div>
    </div>
  );
}

function MetricCard({
  title,
  before,
  after,
  unit,
  target,
  improvement,
}: MetricCardProps) {
  const getStatusColor = useCallback(
    (
      value: number | undefined,
      target: string,
      improvement: string
    ): StatusColor => {
      if (!value) return "gray";

      // Check if improvement is negative (worse performance)
      if (improvement.includes("-")) return "red";

      // If improvement is N/A
      if (improvement === "N/A") return "gray";

      return "green";
    },
    []
  );

  const getImprovementIcon = useCallback((improvement: string): string => {
    if (improvement === "N/A") return "📊";
    if (improvement.includes("-")) return "📉";
    return "📈";
  }, []);

  const statusColor = getStatusColor(after, target, improvement);
  const improvementIcon = getImprovementIcon(improvement);

  const colorClasses = {
    green: "text-green-600 dark:text-green-400",
    red: "text-red-600 dark:text-red-400",
    gray: "text-gray-600 dark:text-gray-400",
  };

  return (
    <div className="metric-card bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>

      <div className="metric-values space-y-3 mb-4">
        <div className="metric-before flex justify-between">
          <span className="label text-gray-600 dark:text-gray-400 font-medium">
            Before:
          </span>
          <span className="value text-red-600 dark:text-red-400 font-semibold">
            {before !== undefined ? (
              <>
                {unit === "" ? before.toFixed(3) : Math.round(before)}
                {unit}
              </>
            ) : (
              "N/A"
            )}
          </span>
        </div>

        <div className="metric-after flex justify-between">
          <span className="label text-gray-600 dark:text-gray-400 font-medium">
            After:
          </span>
          <span className="value text-green-600 dark:text-green-400 font-semibold">
            {after !== undefined ? (
              <>
                {unit === "" ? after.toFixed(3) : Math.round(after)}
                {unit}
              </>
            ) : (
              "N/A"
            )}
          </span>
        </div>
      </div>

      <div
        className={`metric-improvement flex items-center justify-between mb-3 ${colorClasses[statusColor]}`}
      >
        <span className="font-medium">{improvementIcon} Improvement:</span>
        <span className="font-semibold">{improvement}</span>
      </div>

      <div className="metric-target text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600 pt-3">
        <span className="font-medium">Target:</span> {target}
      </div>
    </div>
  );
}
