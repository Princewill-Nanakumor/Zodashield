// /Users/safeconnection/Downloads/drivecrm-main/src/app/api/users/[userId]/leads/assign/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import Lead from "@/models/Lead";
import { authOptions } from "@/libs/auth";

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

    const lead = await Lead.findByIdAndUpdate(
      leadId,
      {
        assignedTo: userId,
        status: "ASSIGNED",
        assignedAt: new Date(),
      },
      { new: true }
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
