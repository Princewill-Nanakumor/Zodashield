// src/app/api/analytics/summary/route.ts
import { NextRequest, NextResponse } from "next/server";

interface PerformanceMetrics {
  lcp: number;
  inp: number;
  ttfb: number;
  cls: number;
  errorRate: number;
  conversionRate: number;
}

interface PerformanceSummary {
  before: PerformanceMetrics;
  after: PerformanceMetrics;
}

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters and request info
    const searchParams = request.nextUrl.searchParams;
    const dateRange = searchParams.get("dateRange") || "last-30-days";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const ip = request.headers.get("x-forwarded-for") || "unknown";

    // Add slight randomization to simulate real data changes
    const randomVariation = () => 0.9 + Math.random() * 0.2; // ±10% variation

    const baseMetrics = {
      before: {
        lcp: 3200,
        inp: 250,
        ttfb: 900,
        cls: 0.15,
        errorRate: 2.3,
        conversionRate: 1.8,
      },
      after: {
        lcp: 2100,
        inp: 180,
        ttfb: 650,
        cls: 0.08,
        errorRate: 1.1,
        conversionRate: 2.4,
      },
    };

    // Apply small random variations
    const summary: PerformanceSummary = {
      before: {
        lcp: Math.round(baseMetrics.before.lcp * randomVariation()),
        inp: Math.round(baseMetrics.before.inp * randomVariation()),
        ttfb: Math.round(baseMetrics.before.ttfb * randomVariation()),
        cls: Number((baseMetrics.before.cls * randomVariation()).toFixed(3)),
        errorRate: Number(
          (baseMetrics.before.errorRate * randomVariation()).toFixed(1)
        ),
        conversionRate: Number(
          (baseMetrics.before.conversionRate * randomVariation()).toFixed(1)
        ),
      },
      after: {
        lcp: Math.round(baseMetrics.after.lcp * randomVariation()),
        inp: Math.round(baseMetrics.after.inp * randomVariation()),
        ttfb: Math.round(baseMetrics.after.ttfb * randomVariation()),
        cls: Number((baseMetrics.after.cls * randomVariation()).toFixed(3)),
        errorRate: Number(
          (baseMetrics.after.errorRate * randomVariation()).toFixed(1)
        ),
        conversionRate: Number(
          (baseMetrics.after.conversionRate * randomVariation()).toFixed(1)
        ),
      },
    };

    // Calculate improvements for logging
    const improvements = {
      lcp: (
        ((summary.before.lcp - summary.after.lcp) / summary.before.lcp) *
        100
      ).toFixed(1),
      inp: (
        ((summary.before.inp - summary.after.inp) / summary.before.inp) *
        100
      ).toFixed(1),
      ttfb: (
        ((summary.before.ttfb - summary.after.ttfb) / summary.before.ttfb) *
        100
      ).toFixed(1),
      cls: (
        ((summary.before.cls - summary.after.cls) / summary.before.cls) *
        100
      ).toFixed(1),
      errorRate: (
        ((summary.before.errorRate - summary.after.errorRate) /
          summary.before.errorRate) *
        100
      ).toFixed(1),
      conversionRate: (
        ((summary.after.conversionRate - summary.before.conversionRate) /
          summary.before.conversionRate) *
        100
      ).toFixed(1),
    };

    console.log("📊 Performance Summary Generated:", {
      timestamp: new Date().toISOString(),
      requestId: Math.random().toString(36).substring(2, 11),
      dateRange,
      userAgent: userAgent.substring(0, 50) + "...", // Truncate for cleaner logs
      ip,
      improvements,
    });

    return NextResponse.json({
      ...summary,
      metadata: {
        dateRange,
        generatedAt: new Date().toISOString(),
        improvements,
      },
    });
  } catch (error) {
    console.error("Error generating summary:", error);
    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 }
    );
  }
}

// Handle other methods
export async function POST() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}
