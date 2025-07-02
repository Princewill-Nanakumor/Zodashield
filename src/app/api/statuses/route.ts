// src/app/api/statuses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import { Status } from "@/models/Status";
import { authOptions } from "@/libs/auth";

// GET /api/statuses
export async function GET() {
  try {
    // Do NOT pass req here in the App Router!
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const statuses = await Status.find({}).sort({ createdAt: 1 });

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

    await connectMongoDB();

    const { name, color } = await req.json();
    if (!name || !color) {
      return NextResponse.json(
        { message: "Name and color are required" },
        { status: 400 }
      );
    }

    const newStatus = await Status.create({ name, color });
    return NextResponse.json(newStatus, { status: 201 });
  } catch (error) {
    console.error("Error creating status:", error);
    return NextResponse.json(
      { message: "Failed to create status" },
      { status: 500 }
    );
  }
}
