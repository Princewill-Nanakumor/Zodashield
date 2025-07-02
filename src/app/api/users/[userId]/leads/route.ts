// /Users/safeconnection/Downloads/drivecrm-main/src/app/api/users/[userId]/leads/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import User from "@/models/User";
import Lead from "@/models/Lead";
import { authOptions } from "@/libs/auth";

function extractUserIdFromUrl(urlString: string): string {
  const url = new URL(urlString);
  const parts = url.pathname.split("/");
  // Assumes route: /api/users/[userId]/leads
  // e.g. /api/users/123/leads -> parts = ["", "api", "users", "123", "leads"]
  return parts[parts.length - 2];
}

export async function POST(request: Request) {
  try {
    const userId = extractUserIdFromUrl(request.url);

    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { leadIds } = await request.json();

    await connectMongoDB();

    const user = await User.findOne({
      _id: userId,
      createdBy: session.user.id,
      status: "ACTIVE",
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found or inactive" },
        { status: 404 }
      );
    }

    await Lead.updateMany(
      { _id: { $in: leadIds } },
      {
        $set: {
          assignedTo: user._id,
          status: "ASSIGNED",
          assignedAt: new Date(),
        },
      }
    );

    await User.findByIdAndUpdate(user._id, {
      $addToSet: { assignedLeads: { $each: leadIds } },
    });

    return NextResponse.json({
      message: "Leads assigned successfully",
    });
  } catch (error: unknown) {
    console.error("Error assigning leads:", error);
    return NextResponse.json(
      { message: "Error assigning leads" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const userId = extractUserIdFromUrl(request.url);

    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const leads = await Lead.find({ assignedTo: userId })
      .select("_id firstName lastName email status assignedAt")
      .sort({ assignedAt: -1 });

    return NextResponse.json(leads);
  } catch (error: unknown) {
    console.error("Error fetching assigned leads:", error);
    return NextResponse.json(
      { message: "Error fetching assigned leads" },
      { status: 500 }
    );
  }
}
