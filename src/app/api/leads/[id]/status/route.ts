import { NextRequest, NextResponse } from "next/server";
import { getServerSession, Session as NextAuthSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import Lead from "@/models/Lead";
import Activity from "@/models/Activity";
import { authOptions } from "@/libs/auth";
import mongoose from "mongoose";

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

type SessionLike = NextAuthSession | StrictSession;

function getCorrectAdminId(session: SessionLike): mongoose.Types.ObjectId {
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

    const { status: newStatus } = await req.json();
    if (!newStatus) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    const segments = req.url.split("/");
    const id = segments[segments.length - 2];

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });
    }

    const sessionUser =
      (session as StrictSession).user ?? (session as NextAuthSession).user;
    const query: {
      _id: mongoose.Types.ObjectId;
      adminId?: mongoose.Types.ObjectId;
    } = {
      _id: new mongoose.Types.ObjectId(id),
    };

    if (sessionUser.role === "ADMIN") {
      query.adminId = new mongoose.Types.ObjectId(sessionUser.id);
    } else if (sessionUser.role === "AGENT" && sessionUser.adminId) {
      query.adminId = new mongoose.Types.ObjectId(sessionUser.adminId);
    }

    const updatedLead = (await Lead.findOneAndUpdate(
      query,
      {
        status: newStatus,
        updatedAt: new Date(),
      },
      {
        new: true,
        lean: true,
        runValidators: false,
        projection: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          phone: 1,
          country: 1,
          source: 1,
          status: 1,
          assignedTo: 1,
          comments: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      }
    )) as LeadDoc | null;

    if (!updatedLead) {
      return NextResponse.json(
        { error: "Lead not found or not authorized" },
        { status: 404 }
      );
    }

    const commonStatuses = [
      "new",
      "NEW",
      "contacted",
      "CONTACTED",
      "qualified",
      "QUALIFIED",
      "converted",
      "CONVERTED",
    ];

    if (!commonStatuses.includes(newStatus)) {
      let statusExists = false;
      const db = mongoose.connection.db;
      if (!db) {
        throw new Error("Database connection not available");
      }

      if (mongoose.Types.ObjectId.isValid(newStatus)) {
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
    }

    Promise.resolve().then(async () => {
      try {
        await Activity.create({
          type: "STATUS_CHANGE",
          userId: new mongoose.Types.ObjectId(sessionUser.id),
          details: `Status changed to ${newStatus}`,
          leadId: updatedLead._id,
          adminId: getCorrectAdminId(session),
          timestamp: new Date(),
          metadata: {
            newStatusId: newStatus,
            newStatus: newStatus,
            status: newStatus,
          },
        });
      } catch (err) {
        console.error("Error creating activity log:", err);
      }
    });

    const responseData = {
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
    };

    return NextResponse.json(responseData, {
      status: 200,
      headers: {
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
