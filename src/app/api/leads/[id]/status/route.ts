// app/api/leads/[id]/status/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import Lead from "@/models/Lead";
import Activity from "@/models/Activity";
import { authOptions } from "@/libs/auth";
import mongoose from "mongoose";

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
    const db = mongoose.connection.db;
    let oldStatusName = "Unknown";
    let newStatusName = "Unknown";

    if (db) {
      try {
        const statusCollection = db.collection("status");

        if (oldStatus) {
          const oldStatusDoc = await statusCollection.findOne({
            _id: new mongoose.Types.ObjectId(oldStatus),
          });
          oldStatusName = oldStatusDoc?.name || oldStatus;
        }

        const newStatusDoc = await statusCollection.findOne({
          _id: new mongoose.Types.ObjectId(newStatus),
        });
        newStatusName = newStatusDoc?.name || newStatus;
      } catch (error) {
        console.error("Error fetching status names:", error);
        oldStatusName = oldStatus || "Unknown";
        newStatusName = newStatus;
      }
    } else {
      oldStatusName = oldStatus || "Unknown";
      newStatusName = newStatus;
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
      oldStatusId: oldStatus,
      newStatusId: newStatus,
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
