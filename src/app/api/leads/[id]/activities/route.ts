import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import Activity from "@/models/Activity";
// Import User model to ensure Mongoose can populate userId (required for production)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import User from "@/models/User";
import { authOptions } from "@/libs/auth";
import mongoose from "mongoose";

// Cache for status names to reduce database queries
const statusCache = new Map<string, string>();

// Helper function to resolve status names
async function resolveStatusNames(
  statusIds: Set<string>
): Promise<Record<string, string>> {
  const statusNames: Record<string, string> = {};
  const uncachedIds: string[] = [];

  // Always resolve "new" to "New"
  if (statusIds.has("new")) {
    statusNames["new"] = "New";
    statusIds.delete("new");
  }

  // Check cache first
  for (const statusId of statusIds) {
    const cached = statusCache.get(statusId);
    if (cached) {
      statusNames[statusId] = cached;
    } else {
      uncachedIds.push(statusId);
    }
  }

  // Fetch uncached status names from DB as before...
  if (uncachedIds.length > 0) {
    try {
      const db = mongoose.connection.db;
      if (db) {
        const statusCollection = db.collection("status");
        const statusDocs = await statusCollection
          .find({
            _id: {
              $in: uncachedIds.map((id) => new mongoose.Types.ObjectId(id)),
            },
          })
          .toArray();

        statusDocs.forEach((status) => {
          const statusId = status._id.toString();
          const statusName = status.name;
          statusNames[statusId] = statusName;
          statusCache.set(statusId, statusName);
        });
      }
    } catch (error) {
      console.error("Error fetching status names:", error);
    }
  }

  return statusNames;
}

// Define session user interface
interface SessionUser {
  id: string;
  role: "ADMIN" | "AGENT";
  adminId?: string;
  firstName?: string;
  lastName?: string;
}

// Define session interface
interface Session {
  user: SessionUser;
}

// Utility function to determine correct adminId based on user role
function getCorrectAdminId(session: Session): mongoose.Types.ObjectId {
  if (session.user.role === "ADMIN") {
    return new mongoose.Types.ObjectId(session.user.id);
  } else if (session.user.role === "AGENT" && session.user.adminId) {
    return new mongoose.Types.ObjectId(session.user.adminId);
  }
  throw new Error("Invalid user role or missing adminId for agent");
}

// Type for activity document from lean query
interface ActivityDocument {
  _id: mongoose.Types.ObjectId;
  leadId?: mongoose.Types.ObjectId;
  type: string;
  details: string;
  timestamp: Date;
  updatedAt: Date;
  adminId?: mongoose.Types.ObjectId; // Multi-tenancy
  userId?:
    | {
        _id: mongoose.Types.ObjectId;
        firstName: string;
        lastName: string;
      }
    | mongoose.Types.ObjectId;
  metadata?: {
    oldStatusId?: string;
    newStatusId?: string;
    oldStatus?: string;
    newStatus?: string;
    [key: string]: unknown;
  };
}

export async function GET(request: NextRequest) {
  try {
    // --- Debugging omitted for brevity, keep if needed ---

    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const leadId = pathParts[pathParts.length - 2];

    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    await connectMongoDB();
    const adminId = getCorrectAdminId(session);

    // Build query that handles both old activities (without adminId) and new activities (with adminId)
    const query: {
      leadId: mongoose.Types.ObjectId;
      $or: Array<
        { adminId?: mongoose.Types.ObjectId } | { adminId: { $exists: false } }
      >;
    } = {
      leadId: new mongoose.Types.ObjectId(leadId),
      $or: [
        { adminId: adminId }, // New activities with adminId
        { adminId: { $exists: false } }, // Old activities without adminId
      ],
    };

    // Find activities with proper population and multi-tenancy filter
    const activities = await Activity.find(query)
      .populate("userId", "firstName lastName")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Collect status IDs for resolution
    const statusIds = new Set<string>();
    activities.forEach((activity: unknown) => {
      const act = activity as ActivityDocument;
      if (
        act.metadata?.oldStatusId &&
        mongoose.Types.ObjectId.isValid(act.metadata.oldStatusId)
      ) {
        statusIds.add(act.metadata.oldStatusId);
      }
      if (
        act.metadata?.newStatusId &&
        mongoose.Types.ObjectId.isValid(act.metadata.newStatusId)
      ) {
        statusIds.add(act.metadata.newStatusId);
      }
    });

    // Resolve status names
    const statusNames = await resolveStatusNames(statusIds);

    // Transform activities
    const transformedActivities = activities.map((activity: unknown) => {
      const act = activity as ActivityDocument;

      // Handle populated userId
      let createdBy = {
        _id: "unknown",
        firstName: "Unknown",
        lastName: "User",
      };

      if (act.userId) {
        if (Array.isArray(act.userId)) {
          createdBy = act.userId[0] || createdBy;
        } else if (typeof act.userId === "object" && act.userId !== null) {
          // Check if it's a populated user object
          if ("firstName" in act.userId && "lastName" in act.userId) {
            createdBy = {
              _id: act.userId._id?.toString() || "unknown",
              firstName: act.userId.firstName || "Unknown",
              lastName: act.userId.lastName || "User",
            };
          } else {
            // It's just an ObjectId
            createdBy = {
              _id: act.userId.toString(),
              firstName: "Unknown",
              lastName: "User",
            };
          }
        }
      }

      // Resolve status names
      const oldStatus =
        act.metadata?.oldStatusId && statusNames[act.metadata.oldStatusId]
          ? statusNames[act.metadata.oldStatusId]
          : act.metadata?.oldStatus || "Unknown";

      const newStatus =
        act.metadata?.newStatusId && statusNames[act.metadata.newStatusId]
          ? statusNames[act.metadata.newStatusId]
          : act.metadata?.newStatus || "Unknown";

      return {
        _id: act._id.toString(),
        leadId: act.leadId?.toString(),
        type: act.type,
        description: act.details,
        createdBy,
        createdAt: act.timestamp,
        updatedAt: act.updatedAt,
        metadata: {
          ...act.metadata,
          oldStatus,
          newStatus,
        },
      };
    });

    return NextResponse.json(transformedActivities);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    } else {
      console.error("Unknown error type:", typeof error);
      console.error("Error value:", error);
    }
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
