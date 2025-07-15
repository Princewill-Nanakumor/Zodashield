import { NextRequest, NextResponse } from "next/server";
import { getServerSession, Session as NextAuthSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import Lead from "@/models/Lead";
import Activity from "@/models/Activity";
import { authOptions } from "@/libs/auth";
import mongoose from "mongoose";

// Define the type for a Lean Lead document
interface LeadDoc {
  _id: mongoose.Types.ObjectId | string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  country?: string;
  source?: string;
  status: string;
  assignedTo?: Record<string, unknown> | null;
  comments?: unknown;
  createdAt: Date;
  updatedAt: Date;
}

interface SessionUser {
  id: string;
  role: "ADMIN" | "AGENT";
  adminId?: string;
  firstName?: string;
  lastName?: string;
}

interface StrictSession {
  user: SessionUser;
}

// Accept both NextAuth's Session and our strict session
type SessionLike = NextAuthSession | StrictSession;

function getCorrectAdminId(session: SessionLike): mongoose.Types.ObjectId {
  // Accept both NextAuth's Session and our strict session
  const user =
    (session as StrictSession).user ?? (session as NextAuthSession).user;
  if (!user) throw new Error("Session user missing");
  if (user.role === "ADMIN") {
    return new mongoose.Types.ObjectId(user.id);
  } else if (user.role === "AGENT" && user.adminId) {
    return new mongoose.Types.ObjectId(user.adminId);
  }
  throw new Error("Invalid user role or missing adminId for agent");
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    // Validate request body
    let requestBody;
    try {
      const bodyText = await req.text();
      if (!bodyText) {
        return NextResponse.json(
          { error: "Request body is required" },
          { status: 400 }
        );
      }
      requestBody = JSON.parse(bodyText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { status: newStatus } = requestBody;
    if (!newStatus) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Extract lead ID from URL
    const segments = req.url.split("/");
    const id = segments[segments.length - 2];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });
    }

    // Build query for multi-tenancy
    const user =
      (session as StrictSession).user ?? (session as NextAuthSession).user;
    const query: {
      _id: mongoose.Types.ObjectId;
      adminId?: mongoose.Types.ObjectId;
    } = {
      _id: new mongoose.Types.ObjectId(id),
    };
    if (user.role === "ADMIN") {
      query.adminId = new mongoose.Types.ObjectId(user.id);
    } else if (user.role === "AGENT" && user.adminId) {
      query.adminId = new mongoose.Types.ObjectId(user.adminId);
    }

    // Find the current lead
    const currentLead = (await Lead.findOne(query).lean()) as LeadDoc | null;
    if (!currentLead) {
      return NextResponse.json(
        { error: "Lead not found or not authorized" },
        { status: 404 }
      );
    }
    const oldStatus = currentLead.status;

    // Validate new status (allow "new" or valid ObjectId in status collection)
    let statusExists = false;
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not available");
    }
    if (typeof newStatus === "string" && newStatus.toLowerCase() === "new") {
      statusExists = true;
    } else if (mongoose.Types.ObjectId.isValid(newStatus)) {
      const statusDoc = await db
        .collection("status")
        .findOne({ _id: new mongoose.Types.ObjectId(newStatus) });
      statusExists = !!statusDoc;
    } else {
      const statusDoc = await db
        .collection("status")
        .findOne({ name: newStatus });
      statusExists = !!statusDoc;
    }
    if (!statusExists) {
      return NextResponse.json(
        { error: "Invalid status ID or name" },
        { status: 400 }
      );
    }

    // Only update if status is different
    if (oldStatus === newStatus) {
      return NextResponse.json({
        ...currentLead,
        _id: currentLead._id.toString(),
        status: oldStatus,
      });
    }

    // Update the lead status
    const updatedLead = (await Lead.findOneAndUpdate(
      query,
      { status: newStatus, updatedAt: new Date() },
      { new: true, lean: true }
    )) as LeadDoc | null;
    if (!updatedLead) {
      return NextResponse.json(
        { error: "Failed to update lead" },
        { status: 500 }
      );
    }

    // Log activity (non-blocking)
    Activity.create({
      type: "STATUS_CHANGE",
      userId: new mongoose.Types.ObjectId(user.id),
      details: `Status changed from ${oldStatus} to ${newStatus}`,
      leadId: updatedLead._id,
      adminId: getCorrectAdminId(session),
      timestamp: new Date(),
      metadata: {
        oldStatusId: oldStatus,
        newStatusId: newStatus,
        oldStatus: oldStatus,
        newStatus: newStatus,
        status: newStatus,
      },
    }).catch((err: unknown) => {
      console.error("Error creating activity log:", err);
    });

    // Return the updated lead
    return NextResponse.json({
      _id: updatedLead._id.toString(),
      firstName: updatedLead.firstName,
      lastName: updatedLead.lastName,
      email: updatedLead.email,
      phone: updatedLead.phone,
      country: updatedLead.country,
      source: updatedLead.source,
      status: updatedLead.status,
      assignedTo: updatedLead.assignedTo ?? null,
      comments: updatedLead.comments ?? null,
      createdAt: updatedLead.createdAt,
      updatedAt: updatedLead.updatedAt,
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
