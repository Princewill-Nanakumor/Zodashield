// src/app/api/analytics/web-vitals/route.ts
import { NextRequest, NextResponse } from "next/server";

interface WebVitalData {
  name: "LCP" | "INP" | "CLS" | "FCP" | "TTFB";
  value: number;
  id: string;
  delta: number;
  rating: "good" | "needs-improvement" | "poor";
  url: string;
  timestamp: number;
  userAgent: string;
}

interface EnrichedWebVitalData extends WebVitalData {
  serverTimestamp: string;
  ip?: string;
  referer?: string;
}

export async function POST(request: NextRequest) {
  try {
    const webVitalData: WebVitalData = await request.json();

    // Validate required fields
    if (!webVitalData.name || !webVitalData.value || !webVitalData.id) {
      return NextResponse.json(
        { error: "Missing required web vital data" },
        { status: 400 }
      );
    }

    const enrichedData: EnrichedWebVitalData = {
      ...webVitalData,
      serverTimestamp: new Date().toISOString(),
      ip: request.headers.get("x-forwarded-for") || "unknown",
      referer: request.headers.get("referer") || undefined,
    };

    // Log web vital with performance context
    const emoji =
      webVitalData.rating === "good"
        ? "🟢"
        : webVitalData.rating === "needs-improvement"
          ? "🟡"
          : "🔴";

    console.log(`${emoji} Web Vital - ${webVitalData.name}:`, {
      value:
        webVitalData.name === "CLS"
          ? webVitalData.value.toFixed(3)
          : `${Math.round(webVitalData.value)}ms`,
      rating: webVitalData.rating,
      url: webVitalData.url,
      timestamp: enrichedData.serverTimestamp,
    });

    // In production, save to database
    // await db.collection('web_vitals').insertOne(enrichedData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error storing web vital:", error);
    return NextResponse.json(
      { error: "Failed to store web vital" },
      { status: 500 }
    );
  }
}

// Handle other methods
export async function GET() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}
