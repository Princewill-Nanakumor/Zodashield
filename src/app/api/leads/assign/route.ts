// app/api/leads/assign/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { connectMongoDB } from "@/libs/dbConfig";
import { authOptions } from "@/libs/auth";

interface AssignLeadsRequest {
  leadIds: string[];
  userId: string;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { leadIds, userId }: AssignLeadsRequest = await request.json();

    if (!leadIds?.length || !userId) {
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
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const leadObjectIds = leadIds.map((id) => new mongoose.Types.ObjectId(id));

    // Get leads before update
    const beforeLeads = await db
      .collection("leads")
      .find({ _id: { $in: leadObjectIds } })
      .toArray();

    // Get user details
    const [assignedToUser, assignedByUser] = await Promise.all([
      db
        .collection("users")
        .findOne(
          { _id: userObjectId },
          { projection: { firstName: 1, lastName: 1 } }
        ),
      db
        .collection("users")
        .findOne(
          { _id: new mongoose.Types.ObjectId(session.user.id) },
          { projection: { firstName: 1, lastName: 1 } }
        ),
    ]);

    if (!assignedToUser) {
      throw new Error("Target user not found");
    }

    if (!assignedByUser) {
      throw new Error("Assigned by user not found");
    }

    // Update leads and create activities
    const updatePromises = beforeLeads.map(async (lead) => {
      const oldAssignedTo = lead.assignedTo;
      const isReassignment = !!oldAssignedTo;

      // Check if assignment is actually changing
      if (oldAssignedTo && oldAssignedTo.toString() === userId) {
        return lead; // No change needed
      }

      // Store assignedTo as an object with user details for consistency
      const assignedToData = {
        _id: assignedToUser._id,
        firstName: assignedToUser.firstName,
        lastName: assignedToUser.lastName,
      };

      // Update lead
      const updatedLead = await db.collection("leads").findOneAndUpdate(
        { _id: lead._id },
        {
          $set: {
            assignedTo: assignedToData,
            assignedAt: new Date(),
            updatedAt: new Date(),
          },
        },
        { returnDocument: "after" }
      );

      // Create activity only if assignment actually changed
      const activityData = {
        type: "ASSIGNMENT",
        userId: new mongoose.Types.ObjectId(session.user.id),
        details: isReassignment
          ? `Lead reassigned from ${oldAssignedTo ? "Previous User" : "Unknown"} to ${assignedToUser.firstName} ${assignedToUser.lastName}`
          : `Lead assigned to ${assignedToUser.firstName} ${assignedToUser.lastName}`,
        leadId: lead._id,
        timestamp: new Date(),
        metadata: {
          assignedTo: {
            _id: assignedToUser._id,
            firstName: assignedToUser.firstName,
            lastName: assignedToUser.lastName,
          },
          assignedFrom: oldAssignedTo ? { _id: oldAssignedTo } : null,
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
    const actualUpdates = results.filter((lead) => lead !== null);

    console.log("Assignment completed for leads:", actualUpdates.length);

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${actualUpdates.length} leads`,
      modifiedCount: actualUpdates.length,
      assignedTo: {
        id: assignedToUser._id.toString(),
        firstName: assignedToUser.firstName,
        lastName: assignedToUser.lastName,
      },
    });
  } catch (error) {
    console.error("Error in assign endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Error assigning leads",
      },
      { status: 500 }
    );
  }
}
