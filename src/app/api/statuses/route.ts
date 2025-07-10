// src/app/api/statuses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import { Status } from "@/models/Status";
import { authOptions } from "@/libs/auth";

// Helper to retry DB operation if connection fails
async function withDbRetry<T>(
  operation: () => Promise<T>,
  retries = 2
): Promise<T> {
  let lastError;
  for (let i = 0; i <= retries; i++) {
    try {
      await connectMongoDB();
      return await operation();
    } catch (err) {
      lastError = err;
      if (i === retries) throw err;
      // Wait a bit before retrying
      await new Promise((res) => setTimeout(res, 500 * (i + 1)));
    }
  }
  throw lastError;
}

// GET /api/statuses
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const statuses = await withDbRetry(() =>
      Status.find({}).sort({ createdAt: 1 })
    );

    // Set cache headers
    const headers = new Headers();
    headers.set("Cache-Control", "private, max-age=300"); // 5 minutes
    headers.set("Vary", "Cookie");

    return NextResponse.json(statuses, {
      headers,
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching statuses:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST /api/statuses
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, color } = await req.json();
    if (!name || !color) {
      return NextResponse.json(
        { message: "Name and color are required" },
        { status: 400 }
      );
    }

    const newStatus = await withDbRetry(() => Status.create({ name, color }));
    return NextResponse.json(newStatus, { status: 201 });
  } catch (error) {
    console.error("Error creating status:", error);
    return NextResponse.json(
      { message: "Failed to create status" },
      { status: 500 }
    );
  }
}
