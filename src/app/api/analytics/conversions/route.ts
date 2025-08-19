// src/app/api/analytics/conversions/route.ts
import { NextRequest, NextResponse } from "next/server";

// Define specific types for additional properties
type ConversionEventType =
  | "purchase"
  | "signup"
  | "lead_generation"
  | "add_to_cart"
  | "view_content"
  | string;
type CurrencyCode = "USD" | "EUR" | "GBP" | "CAD" | "AUD" | string;

interface ConversionData {
  event: ConversionEventType;
  value: number;
  currency?: CurrencyCode;
  timestamp: number;
  url?: string;
  sessionId?: string;
  userId?: string;
  productId?: string;
  productName?: string;
  category?: string;
  campaign?: string;
  source?: string;
  medium?: string;
  term?: string;
  content?: string;
  discount?: number;
  quantity?: number;
  taxAmount?: number;
  shippingAmount?: number;
  couponCode?: string;
  paymentMethod?: string;
  customerType?: "new" | "returning";
  device?: "mobile" | "tablet" | "desktop";
  browser?: string;
  os?: string;
  referrer?: string;
  landingPage?: string;
  exitPage?: string;
  timeOnSite?: number;
  pageViews?: number;
  customData?: Record<string, string | number | boolean>;
}

interface EnrichedConversionData extends ConversionData {
  serverTimestamp: string;
  userAgent?: string;
  referer?: string;
  ip?: string;
}

export async function POST(request: NextRequest) {
  try {
    const conversionData: ConversionData = await request.json();

    // Validate required fields
    if (!conversionData.event || typeof conversionData.event !== "string") {
      return NextResponse.json(
        { error: "Valid event name is required" },
        { status: 400 }
      );
    }

    if (typeof conversionData.value !== "number" || conversionData.value < 0) {
      return NextResponse.json(
        { error: "Valid conversion value is required" },
        { status: 400 }
      );
    }

    // Validate timestamp
    if (
      typeof conversionData.timestamp !== "number" ||
      conversionData.timestamp <= 0
    ) {
      return NextResponse.json(
        { error: "Valid timestamp is required" },
        { status: 400 }
      );
    }

    // Validate currency if provided
    if (
      conversionData.currency &&
      typeof conversionData.currency !== "string"
    ) {
      return NextResponse.json(
        { error: "Currency must be a valid string" },
        { status: 400 }
      );
    }

    const enrichedConversion: EnrichedConversionData = {
      ...conversionData,
      serverTimestamp: new Date().toISOString(),
      userAgent: request.headers.get("user-agent") || undefined,
      referer: request.headers.get("referer") || undefined,
      ip: request.headers.get("x-forwarded-for") || "unknown",
      currency: conversionData.currency || "USD", // Default currency
    };

    // Log conversion for monitoring
    console.log("💰 Conversion Received:", {
      event: enrichedConversion.event,
      value: enrichedConversion.value,
      currency: enrichedConversion.currency,
      url: enrichedConversion.url,
      timestamp: enrichedConversion.serverTimestamp,
      sessionId: enrichedConversion.sessionId,
      userId: enrichedConversion.userId,
      productId: enrichedConversion.productId,
      category: enrichedConversion.category,
    });

    // In production, save to database
    // await db.collection('conversions').insertOne(enrichedConversion);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error storing conversion:", error);
    return NextResponse.json(
      { error: "Failed to store conversion" },
      { status: 500 }
    );
  }
}

// Handle other methods
export async function GET() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}
