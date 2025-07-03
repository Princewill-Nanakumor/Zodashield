// drivecrm/src/app/api/leads/assigned/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { connectMongoDB } from "@/libs/dbConfig";
import { authOptions } from "@/libs/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    // Check if database connection is available
    if (!mongoose.connection.db) {
      throw new Error("Database connection not available");
    }

    const userObjectId = new mongoose.Types.ObjectId(session.user.id);

    const query =
      session.user.role === "ADMIN"
        ? { assignedTo: { $exists: true, $ne: null } }
        : { assignedTo: userObjectId };

    const assignedLeads = await mongoose.connection.db
      .collection("leads")
      .find(query)
      .sort({ updatedAt: -1 })
      .toArray();

    return NextResponse.json({
      assignedLeads: assignedLeads.map((lead) => ({
        _id: lead._id.toString(),
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone,
        country: lead.country,
        status: lead.status,
        source: lead.source,
        assignedTo: lead.assignedTo?.toString(),
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching assigned leads:", error);
    return NextResponse.json(
      {
        message: "Error fetching assigned leads",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
