// app/api/leads/assigned/route.ts
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

    console.log("=== ASSIGNED LEADS GET REQUEST ===");
    console.log("User ID:", session.user.id);
    console.log("User Role:", session.user.role);
    console.log("User adminId:", session.user.adminId);

    // Build query based on user role and multi-tenancy
    let query: {
      $or?: Array<{
        "assignedTo._id"?: mongoose.Types.ObjectId;
        assignedTo?: mongoose.Types.ObjectId;
      }>;
      adminId?: mongoose.Types.ObjectId;
    } = {};

    if (session.user.role === "ADMIN") {
      // Admin sees all assigned leads that belong to them
      query = {
        $or: [
          { "assignedTo._id": userObjectId }, // Object format
          { assignedTo: userObjectId }, // String/ObjectId format
        ],
        adminId: userObjectId, // Multi-tenancy: only leads created by this admin
      };
    } else if (session.user.role === "AGENT") {
      // Agent sees only leads assigned to them from their admin
      const adminId = session.user.adminId
        ? new mongoose.Types.ObjectId(session.user.adminId)
        : undefined;

      query = {
        $or: [
          { "assignedTo._id": userObjectId }, // Object format
          { assignedTo: userObjectId }, // String/ObjectId format
        ],
        ...(adminId && { adminId }), // Multi-tenancy: only leads from their admin
      };
    }

    console.log("Assigned leads query:", JSON.stringify(query, null, 2));

    const assignedLeads = await mongoose.connection.db
      .collection("leads")
      .find(query)
      .sort({ updatedAt: -1 })
      .toArray();

    console.log("Found assigned leads count:", assignedLeads.length);

    // Transform the leads to match the expected format
    const transformedLeads = assignedLeads.map((lead) => {
      // Handle different assignedTo formats
      let assignedToUser = null;
      if (lead.assignedTo) {
        if (typeof lead.assignedTo === "object" && lead.assignedTo._id) {
          // Object format
          assignedToUser = {
            id: lead.assignedTo._id.toString(),
            firstName: lead.assignedTo.firstName,
            lastName: lead.assignedTo.lastName,
          };
        } else if (typeof lead.assignedTo === "string") {
          // String format
          assignedToUser = {
            id: lead.assignedTo,
            firstName: "Unknown",
            lastName: "User",
          };
        }
      }

      return {
        _id: lead._id.toString(),
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email,
        phone: lead.phone || "",
        country: lead.country || "",
        value: lead.value,
        source: lead.source,
        status: lead.status,
        comments: lead.comments || "",
        assignedAt: lead.assignedAt || lead.updatedAt,
        assignedTo: assignedToUser,
        createdAt: lead.createdAt,
        updatedAt: lead.updatedAt,
      };
    });

    console.log("Transformed leads count:", transformedLeads.length);
    console.log(
      "First lead sample:",
      JSON.stringify(transformedLeads[0], null, 2)
    );

    return NextResponse.json({
      assignedLeads: transformedLeads,
      count: transformedLeads.length,
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
