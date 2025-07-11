// app/api/leads/[id]/unassign/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import { authOptions } from "@/libs/auth";
import mongoose from "mongoose";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    // Extract the id from the URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 1];

    // Get the Lead model from mongoose
    const Lead = mongoose.models.Lead;
    if (!Lead) {
      throw new Error("Lead model not found");
    }

    // Build query with multi-tenancy filter
    const query: { _id: string; adminId?: string } = {
      _id: id,
    };

    if (session.user.role === "ADMIN") {
      // Admin can only unassign leads they created
      query.adminId = session.user.id;
    } else if (session.user.role === "AGENT" && session.user.adminId) {
      // Agent can only unassign leads from their admin
      query.adminId = session.user.adminId;
    }

    // Get the current lead to check if it's assigned
    const currentLead = await Lead.findOne(query).populate(
      "assignedTo",
      "firstName lastName"
    );

    if (!currentLead) {
      return NextResponse.json(
        { message: "Lead not found or not authorized" },
        { status: 404 }
      );
    }

    if (!currentLead.assignedTo) {
      return NextResponse.json(
        { message: "Lead is not assigned" },
        { status: 400 }
      );
    }

    const oldAssignedTo = currentLead.assignedTo;

    // Update the lead to unassign
    const lead = await Lead.findByIdAndUpdate(
      id,
      {
        assignedTo: null,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!lead) {
      return NextResponse.json({ message: "Lead not found" }, { status: 404 });
    }

    // Get user details for activity logging
    const db = mongoose.connection.db;
    let assignedFromUser = null;
    let assignedByUser = null;

    if (db) {
      try {
        const usersCollection = db.collection("users");

        // Get the user being unassigned from
        // Handle both populated and unpopulated user references
        const oldUserId =
          typeof oldAssignedTo === "object" && oldAssignedTo._id
            ? oldAssignedTo._id
            : oldAssignedTo;

        const assignedFromDoc = await usersCollection.findOne({
          _id: new mongoose.Types.ObjectId(oldUserId),
        });
        if (assignedFromDoc) {
          assignedFromUser = {
            id: assignedFromDoc._id.toString(),
            firstName: assignedFromDoc.firstName,
            lastName: assignedFromDoc.lastName,
          };
        }

        // Get the user doing the unassignment
        const assignedByDoc = await usersCollection.findOne({
          _id: new mongoose.Types.ObjectId(session.user.id),
        });
        if (assignedByDoc) {
          assignedByUser = {
            id: assignedByDoc._id.toString(),
            firstName: assignedByDoc.firstName,
            lastName: assignedByDoc.lastName,
          };
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    }

    // Create activity log
    const Activity = mongoose.models.Activity;
    if (Activity) {
      const activity = new Activity({
        type: "ASSIGNMENT",
        userId: new mongoose.Types.ObjectId(session.user.id),
        details: `Lead unassigned from ${assignedFromUser ? `${assignedFromUser.firstName} ${assignedFromUser.lastName}` : "Unknown"}`,
        leadId: new mongoose.Types.ObjectId(id),
        adminId: new mongoose.Types.ObjectId(session.user.id), // Multi-tenancy
        timestamp: new Date(),
        metadata: {
          assignedTo: null,
          assignedFrom: assignedFromUser,
          assignedBy: assignedByUser,
        },
      });

      await activity.save();

      console.log("Unassignment activity created:", {
        leadId: id,
        activityId: activity._id,
        type: "UNASSIGNMENT",
        assignedFrom: assignedFromUser,
        details: activity.details,
      });
    }

    return NextResponse.json({
      message: "Lead unassigned successfully",
      lead,
    });
  } catch (error) {
    console.error("Error unassigning lead:", error);
    return NextResponse.json(
      { message: "Error unassigning lead" },
      { status: 500 }
    );
  }
}
