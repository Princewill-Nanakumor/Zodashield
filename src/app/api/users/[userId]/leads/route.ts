// /src/app/api/users/[userId]/leads/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import { authOptions } from "@/libs/auth";
import mongoose from "mongoose";

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

    // Check if database connection is available
    if (!mongoose.connection.db) {
      throw new Error("Database connection not available");
    }

    const db = mongoose.connection.db;

    const user = await db.collection("users").findOne({
      _id: new mongoose.Types.ObjectId(userId),
      createdBy: new mongoose.Types.ObjectId(session.user.id),
      status: "ACTIVE",
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found or inactive" },
        { status: 404 }
      );
    }

    await db.collection("leads").updateMany(
      {
        _id: {
          $in: leadIds.map((id: string) => new mongoose.Types.ObjectId(id)),
        },
      },
      {
        $set: {
          assignedTo: user._id,
          status: "ASSIGNED",
          assignedAt: new Date(),
        },
      }
    );

    await db.collection("users").updateOne(
      { _id: user._id },
      {
        $addToSet: { assignedLeads: { $each: leadIds } },
      }
    );

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

    // Check if database connection is available
    if (!mongoose.connection.db) {
      throw new Error("Database connection not available");
    }

    const db = mongoose.connection.db;

    const leads = await db
      .collection("leads")
      .find({ assignedTo: new mongoose.Types.ObjectId(userId) })
      .project({
        _id: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        status: 1,
        assignedAt: 1,
      })
      .sort({ assignedAt: -1 })
      .toArray();

    return NextResponse.json(leads);
  } catch (error: unknown) {
    console.error("Error fetching assigned leads:", error);
    return NextResponse.json(
      { message: "Error fetching assigned leads" },
      { status: 500 }
    );
  }
}
