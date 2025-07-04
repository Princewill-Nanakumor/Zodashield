// app/api/leads/unassign/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { connectMongoDB } from "@/libs/dbConfig";
import { authOptions } from "@/libs/auth";

interface UnassignLeadsRequest {
  leadIds: string[];
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { leadIds }: UnassignLeadsRequest = await request.json();

    if (!leadIds?.length) {
      return NextResponse.json(
        { message: "Invalid request data" },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // Check if database connection is available
    if (!mongoose.connection.db) {
      throw new Error("Database connection not available");
    }

    const db = mongoose.connection.db;
    const leadObjectIds = leadIds.map((id) => new mongoose.Types.ObjectId(id));

    // Get leads before update with assignedTo
    const beforeLeads = await db
      .collection("leads")
      .find({
        _id: { $in: leadObjectIds },
        assignedTo: { $exists: true, $ne: null },
      })
      .toArray();

    // Get user doing the unassignment
    const assignedByUser = await db
      .collection("users")
      .findOne(
        { _id: new mongoose.Types.ObjectId(session.user.id) },
        { projection: { firstName: 1, lastName: 1 } }
      );

    if (!assignedByUser) {
      throw new Error("User not found");
    }

    // Update leads and create activities
    const updatePromises = beforeLeads.map(async (lead) => {
      const oldAssignedTo = lead.assignedTo;

      // Get the user being unassigned (handle both object and ObjectId formats)
      let unassignedUser = null;
      if (oldAssignedTo) {
        const userId =
          typeof oldAssignedTo === "object" && oldAssignedTo._id
            ? oldAssignedTo._id
            : oldAssignedTo;

        unassignedUser = await db
          .collection("users")
          .findOne(
            { _id: new mongoose.Types.ObjectId(userId) },
            { projection: { firstName: 1, lastName: 1 } }
          );
      }

      // Update lead
      const updatedLead = await db.collection("leads").findOneAndUpdate(
        { _id: lead._id },
        {
          $set: {
            assignedTo: null,
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" }
      );

      // Create activity
      const activityData = {
        type: "ASSIGNMENT", // Using ASSIGNMENT type for unassignment too
        userId: new mongoose.Types.ObjectId(session.user.id),
        details: `Lead unassigned from ${unassignedUser ? `${unassignedUser.firstName} ${unassignedUser.lastName}` : "Unknown User"}`,
        leadId: lead._id,
        timestamp: new Date(),
        metadata: {
          assignedTo: null,
          assignedFrom: unassignedUser
            ? {
                _id: unassignedUser._id,
                firstName: unassignedUser.firstName,
                lastName: unassignedUser.lastName,
              }
            : null,
          assignedBy: {
            _id: assignedByUser._id,
            firstName: assignedByUser.firstName,
            lastName: assignedByUser.lastName,
          },
        },
      };

      await db.collection("activities").insertOne(activityData);
      return updatedLead;
    });

    const results = await Promise.all(updatePromises);
    const updatedLeads = results.filter(Boolean);

    console.log("Unassignment completed for leads:", updatedLeads.length);

    return NextResponse.json({
      success: true,
      message: `Successfully unassigned ${updatedLeads.length} leads`,
      unassignedCount: updatedLeads.length,
    });
  } catch (error) {
    console.error("Error in unassign endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Error unassigning leads",
      },
      { status: 500 }
    );
  }
}
