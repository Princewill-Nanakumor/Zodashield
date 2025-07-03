// /src/app/api/users/[userId]/leads/assign/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import { authOptions } from "@/libs/auth";
import mongoose from "mongoose";

function extractLeadIdFromUrl(urlString: string): string {
  const url = new URL(urlString);
  const parts = url.pathname.split("/");
  // Assumes route: /api/leads/[leadId]/assign
  // e.g. /api/leads/123/assign -> parts = ["", "api", "leads", "123", "assign"]
  return parts[parts.length - 2];
}

export async function POST(request: Request) {
  try {
    const leadId = extractLeadIdFromUrl(request.url);

    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await request.json();

    await connectMongoDB();

    // Check if database connection is available
    if (!mongoose.connection.db) {
      throw new Error("Database connection not available");
    }

    const db = mongoose.connection.db;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(leadId)) {
      return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });
    }

    const lead = await db.collection("leads").findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(leadId) },
      {
        $set: {
          assignedTo: new mongoose.Types.ObjectId(userId),
          status: "ASSIGNED",
          assignedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    );

    if (!lead) {
      return NextResponse.json({ message: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Lead assigned successfully",
      lead,
    });
  } catch (error) {
    console.error("Error assigning lead:", error);
    return NextResponse.json(
      { message: "Error assigning lead" },
      { status: 500 }
    );
  }
}
