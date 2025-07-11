// app/api/leads/[id]/status/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import Lead from "@/models/Lead";
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
    // Ensure database connection is active
    if (mongoose.connection.readyState !== 1) {
      console.log("Database connection not ready, reconnecting...");
      await connectMongoDB();
    }

    const db = mongoose.connection.db;
    if (!db) {
      console.error("Database connection not available");
      return statusId;
    }

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
  } catch (error) {
    console.error("Error fetching status name:", error);
    // Return the original statusId as fallback
    return statusId;
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure database connection is active
    if (mongoose.connection.readyState !== 1) {
      console.log("Database connection not ready, reconnecting...");
      await connectMongoDB();
    }

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

    // Build query with multi-tenancy filter
    const query: { _id: string; adminId?: string } = {
      _id: id,
    };

    if (session.user.role === "ADMIN") {
      // Admin can only update leads they created
      query.adminId = session.user.id;
    } else if (session.user.role === "AGENT" && session.user.adminId) {
      // Agent can only update leads from their admin
      query.adminId = session.user.adminId;
    }

    // Get the current lead to compare status
    const currentLead = await Lead.findOne(query);
    if (!currentLead) {
      return NextResponse.json(
        { error: "Lead not found or not authorized" },
        { status: 404 }
      );
    }

    const oldStatus = currentLead.status;

    // Only update if status actually changed
    if (oldStatus === newStatus) {
      return NextResponse.json(currentLead);
    }

    // Get status names for better activity logging with error handling
    let oldStatusName = "Unknown";
    let newStatusName = newStatus;

    try {
      [oldStatusName, newStatusName] = await Promise.all([
        oldStatus ? getStatusName(oldStatus) : "Unknown",
        getStatusName(newStatus),
      ]);
    } catch (error) {
      console.error("Error getting status names:", error);
      // Continue with fallback names
      oldStatusName = oldStatus || "Unknown";
      newStatusName = newStatus;
    }

    // Validate that the new status exists
    try {
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
    } catch (error) {
      console.error("Error validating status:", error);
      // Continue without validation if there's an error
    }

    const updatedLead = await Lead.findOneAndUpdate(
      query, // Use the same query with multi-tenancy filter
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
    try {
      const activity = new Activity({
        type: "STATUS_CHANGE",
        userId: new mongoose.Types.ObjectId(session.user.id),
        details: `Status changed from ${oldStatusName} to ${newStatusName}`,
        leadId: new mongoose.Types.ObjectId(id),
        adminId: new mongoose.Types.ObjectId(session.user.id), // Multi-tenancy
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
    } catch (activityError) {
      console.error("Error creating activity log:", activityError);
      // Don't fail the entire request if activity logging fails
    }

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error("API Error:", error);

    // Check if it's a connection error
    if (error instanceof Error && error.message.includes("connection")) {
      return NextResponse.json(
        { error: "Database connection error. Please try again." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
