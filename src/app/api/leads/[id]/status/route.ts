// app/api/leads/[id]/status/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import Lead from "@/models/Lead"; // Change this line - use default import
import Activity from "@/models/Activity";
import { authOptions } from "@/libs/auth";
import mongoose from "mongoose";

// Status name cache with proper key formatting
const statusNameCache = new Map<string, string>();

async function getStatusName(statusId: string): Promise<string> {
  // Normalize the statusId to ensure consistent caching
  const normalizedId = statusId.toString();

  // Check cache first
  if (statusNameCache.has(normalizedId)) {
    return statusNameCache.get(normalizedId)!;
  }

  try {
    const db = mongoose.connection.db;
    if (db) {
      const statusCollection = db.collection("status");

      // Try to find by ObjectId first
      let statusDoc = null;
      if (mongoose.Types.ObjectId.isValid(statusId)) {
        statusDoc = await statusCollection.findOne({
          _id: new mongoose.Types.ObjectId(statusId),
        });
      }

      // If not found by ObjectId, try by name (fallback)
      if (!statusDoc) {
        statusDoc = await statusCollection.findOne({
          name: statusId,
        });
      }

      const statusName = statusDoc?.name || statusId;
      statusNameCache.set(normalizedId, statusName);
      return statusName;
    }
  } catch (error) {
    console.error("Error fetching status name:", error);
  }

  return statusId;
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();
    const { status: newStatus } = await req.json();

    if (!newStatus) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Extract the ID directly from the URL
    const segments = req.url.split("/");
    const id = segments[segments.length - 2];

    // Validate lead ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });
    }

    // Get the current lead to compare status
    const currentLead = await Lead.findById(id);
    if (!currentLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const oldStatus = currentLead.status;

    // Only update if status actually changed
    if (oldStatus === newStatus) {
      return NextResponse.json(currentLead);
    }

    // Get status names for better activity logging
    const [oldStatusName, newStatusName] = await Promise.all([
      oldStatus ? getStatusName(oldStatus) : "Unknown",
      getStatusName(newStatus),
    ]);

    // Validate that the new status exists
    const db = mongoose.connection.db;
    if (db) {
      const statusCollection = db.collection("status");
      let statusExists = false;

      if (mongoose.Types.ObjectId.isValid(newStatus)) {
        const statusDoc = await statusCollection.findOne({
          _id: new mongoose.Types.ObjectId(newStatus),
        });
        statusExists = !!statusDoc;
      } else {
        // Try by name
        const statusDoc = await statusCollection.findOne({
          name: newStatus,
        });
        statusExists = !!statusDoc;
      }

      if (!statusExists) {
        return NextResponse.json(
          { error: "Invalid status ID or name" },
          { status: 400 }
        );
      }
    }

    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      {
        status: newStatus,
        updatedAt: new Date(),
      },
      { new: true }
    ).populate("assignedTo");

    if (!updatedLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Create activity log for status change using unified Activity model
    const activity = new Activity({
      type: "STATUS_CHANGE",
      userId: new mongoose.Types.ObjectId(session.user.id),
      details: `Status changed from ${oldStatusName} to ${newStatusName}`,
      leadId: new mongoose.Types.ObjectId(id),
      timestamp: new Date(),
      metadata: {
        oldStatusId: oldStatus,
        newStatusId: newStatus,
        oldStatus: oldStatusName,
        newStatus: newStatusName,
        status: newStatusName,
      },
    });

    await activity.save();

    console.log("Status updated successfully:", {
      leadId: id,
      oldStatus,
      newStatus,
      oldStatusName,
      newStatusName,
      activityId: activity._id,
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
