import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import { authOptions } from "@/libs/auth";
import mongoose from "mongoose";
import Activity from "@/models/Activity";

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

    console.log("Status update request:", {
      url: req.url,
      segments: segments,
      extractedId: id,
      newStatus: newStatus,
      sessionUser: session.user.id,
      sessionRole: session.user.role,
    });

    // Validate lead ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });
    }

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not available");
    }

    // Build query with multi-tenancy filter
    const query: {
      _id: mongoose.Types.ObjectId;
      adminId?: mongoose.Types.ObjectId;
    } = {
      _id: new mongoose.Types.ObjectId(id),
    };

    if (session.user.role === "ADMIN") {
      query.adminId = new mongoose.Types.ObjectId(session.user.id);
    } else if (session.user.role === "AGENT" && session.user.adminId) {
      query.adminId = new mongoose.Types.ObjectId(session.user.adminId);
    }

    console.log("Database query:", query);

    // Get the current lead to compare status
    const currentLead = await db.collection("leads").findOne(query);

    if (!currentLead) {
      return NextResponse.json(
        { error: "Lead not found or not authorized" },
        { status: 404 }
      );
    }

    const oldStatus = currentLead.status;

    // --- PATCH: Allow "new" as a special case ---
    let statusExists = false;
    try {
      const statusCollection = db.collection("status");
      if (typeof newStatus === "string" && newStatus.toLowerCase() === "new") {
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

    // Use updateOne instead of findOneAndUpdate for better reliability
    const updateResult = await db.collection("leads").updateOne(query, {
      $set: {
        status: newStatus,
        updatedAt: new Date(),
      },
    });

    console.log("Update result:", {
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount,
      upsertedCount: updateResult.upsertedCount,
    });

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: "Lead not found or not authorized" },
        { status: 404 }
      );
    }

    if (updateResult.modifiedCount === 0) {
      // Status was already the same, but we'll return success
      console.log("Status was already the same, no modification needed");
    }

    // Get the updated lead
    const updatedLead = await db.collection("leads").findOne(query);

    if (!updatedLead) {
      return NextResponse.json(
        { error: "Failed to retrieve updated lead" },
        { status: 500 }
      );
    }

    console.log("Successfully updated lead:", {
      id: updatedLead._id,
      newStatus: updatedLead.status,
    });

    // Create activity log for status change using Activity model
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
      console.log("Activity created successfully:", activity._id);
    } catch (activityError) {
      console.error("Error creating activity log:", activityError);
    }

    // Return the updated lead with proper formatting
    const formattedLead = {
      _id: updatedLead._id.toString(),
      firstName: updatedLead.firstName,
      lastName: updatedLead.lastName,
      email: updatedLead.email,
      phone: updatedLead.phone,
      country: updatedLead.country,
      source: updatedLead.source,
      status: updatedLead.status,
      assignedTo: updatedLead.assignedTo,
      comments: updatedLead.comments,
      createdAt: updatedLead.createdAt,
      updatedAt: updatedLead.updatedAt,
    };

    return NextResponse.json(formattedLead);
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
