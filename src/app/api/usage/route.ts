// src/app/api/usage/route.ts
import { NextResponse } from "next/server";
import { checkUsageLimits } from "@/lib/usageLimits";

export async function GET() {
  try {
    const usageLimits = await checkUsageLimits();

    return NextResponse.json(usageLimits);
  } catch (error) {
    console.error("Error fetching usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}
