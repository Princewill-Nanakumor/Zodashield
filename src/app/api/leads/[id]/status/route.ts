import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import Lead from "@/models/Lead";
import Activity from "@/models/Activity";
import { authOptions } from "@/libs/auth";
import mongoose from "mongoose";

interface SessionUser {
  id: string;
  role: "ADMIN" | "AGENT";
  adminId?: string;
  firstName?: string;
  lastName?: string;
}

interface Session {
  user: SessionUser;
}

function getCorrectAdminId(session: Session): mongoose.Types.ObjectId {
  if (session.user.role === "ADMIN") {
    return new mongoose.Types.ObjectId(session.user.id);
  } else if (session.user.role === "AGENT" && session.user.adminId) {
    return new mongoose.Types.ObjectId(session.user.adminId);
  }
  throw new Error("Invalid user role or missing adminId for agent");
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure database connection is active
    if (mongoose.connection.readyState !== 1) {
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
      query.adminId = session.user.id;
    } else if (session.user.role === "AGENT" && session.user.adminId) {
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

    // --- PATCH: Allow "new" as a special case ---
    let statusExists = false;
    try {
      const db = mongoose.connection.db;
      if (db) {
        const statusCollection = db.collection("status");
        if (
          typeof newStatus === "string" &&
          newStatus.toLowerCase() === "new"
        ) {
          statusExists = true; // Always allow "new"
        } else if (mongoose.Types.ObjectId.isValid(newStatus)) {
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
      }
    } catch (error) {
      console.error("Error validating status:", error);
      // Continue without validation if there's an error
      statusExists = true;
    }

    if (!statusExists) {
      return NextResponse.json(
        { error: "Invalid status ID or name" },
        { status: 400 }
      );
    }

    const updatedLead = await Lead.findOneAndUpdate(
      query,
      {
        status: newStatus,
        updatedAt: new Date(),
      },
      { new: true }
    ).populate("assignedTo");

    if (!updatedLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Create activity log for status change
    try {
      const activityAdminId = getCorrectAdminId(session as Session);

      const activity = new Activity({
        type: "STATUS_CHANGE",
        userId: new mongoose.Types.ObjectId(session.user.id),
        details: `Status changed from ${oldStatus} to ${newStatus}`,
        leadId: new mongoose.Types.ObjectId(id),
        adminId: activityAdminId,
        timestamp: new Date(),
        metadata: {
          oldStatusId: oldStatus,
          newStatusId: newStatus,
          oldStatus: oldStatus,
          newStatus: newStatus,
          status: newStatus,
        },
      });

      await activity.save();
    } catch (activityError) {
      console.error("Error creating activity log:", activityError);
    }

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error("API Error:", error);

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
