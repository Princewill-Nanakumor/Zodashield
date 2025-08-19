//api/analytics/errors/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const errorData = await request.json();

    const enrichedError = {
      ...errorData,
      serverTimestamp: new Date().toISOString(),
      userAgent: request.headers.get("user-agent"),
      referer: request.headers.get("referer"),
      ip: request.headers.get("x-forwarded-for") || "unknown",
    };

    console.error("🚨 Error Received:", enrichedError);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error storing error:", error);
    return NextResponse.json(
      { error: "Failed to store error" },
      { status: 500 }
    );
  }
}
