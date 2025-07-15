// /Users/safeconnection/Downloads/drivecrm/src/app/api/leads/[id]/activities/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import Activity from "@/models/Activity";
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
    console.log("=== ACTIVITIES API ROUTE STARTED ===");
    console.log("Request URL:", request.url);
    console.log(
      "Request headers:",
      Object.fromEntries(request.headers.entries())
    );

    const session = (await getServerSession(authOptions)) as Session | null;

    console.log("=== SESSION DEBUG ===");
    console.log("Session exists:", !!session);
    if (session) {
      console.log("User ID:", session.user.id);
      console.log("User Role:", session.user.role);
      console.log("Session adminId:", session.user.adminId);
      console.log("Full session object:", JSON.stringify(session, null, 2));
    } else {
      console.log("No session found - user not authenticated");
    }

    if (!session) {
      console.log("=== UNAUTHORIZED - NO SESSION ===");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const leadId = pathParts[pathParts.length - 2];

    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    console.log("=== REQUEST PARAMETERS ===");
    console.log("Lead ID:", leadId);
    console.log("Page:", page, "Limit:", limit, "Skip:", skip);
    console.log("Path parts:", pathParts);

    await connectMongoDB();

    console.log("=== DATABASE CONNECTION ===");
    console.log("Database name:", mongoose.connection.db?.databaseName);
    console.log("Connection ready state:", mongoose.connection.readyState);
    console.log(
      "MongoDB URI (first 30 chars):",
      process.env.MONGODB_URI?.substring(0, 30) + "..."
    );

    const adminId = getCorrectAdminId(session);

    console.log("=== ADMIN ID CALCULATION ===");
    console.log("User ID:", session.user.id);
    console.log("User Role:", session.user.role);
    console.log("Session adminId:", session.user.adminId);
    console.log("Calculated Admin ID:", adminId.toString());
    console.log("Admin ID type:", typeof adminId);
    console.log(
      "Admin ID is ObjectId:",
      adminId instanceof mongoose.Types.ObjectId
    );

    // First, let's check what activities exist for this lead without any filters
    console.log("=== FETCHING ALL ACTIVITIES (NO FILTERS) ===");
    const allActivitiesForLead = await Activity.find({
      leadId: new mongoose.Types.ObjectId(leadId),
    }).lean();

    console.log(
      "Total activities found (no filters):",
      allActivitiesForLead.length
    );
    allActivitiesForLead.forEach((activity, index) => {
      console.log(`Activity ${index + 1}:`, {
        _id: activity._id?.toString(),
        type: activity.type,
        adminId: activity.adminId ? activity.adminId.toString() : "NO ADMIN ID",
        userId: activity.userId ? activity.userId.toString() : "NO USER ID",
        details: activity.details,
        timestamp: activity.timestamp,
        leadId: activity.leadId?.toString(),
      });
    });

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

    console.log("=== FILTERED QUERY DEBUG ===");
    console.log("Query object:", JSON.stringify(query, null, 2));
    console.log("Query adminId to match:", adminId.toString());
    console.log("Query leadId to match:", leadId);

    // Find activities with proper population and multi-tenancy filter
    console.log("=== EXECUTING FILTERED QUERY ===");
    const activities = await Activity.find(query)
      .populate("userId", "firstName lastName")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log("=== FILTERED ACTIVITIES RESULTS ===");
    console.log("Found activities count:", activities.length);
    activities.forEach((activity, index) => {
      console.log(`Filtered Activity ${index + 1}:`, {
        _id: activity._id?.toString(),
        type: activity.type,
        adminId: activity.adminId ? activity.adminId.toString() : "NO ADMIN ID",
        userId: activity.userId ? activity.userId.toString() : "NO USER ID",
        details: activity.details,
        timestamp: activity.timestamp,
        leadId: activity.leadId?.toString(),
      });
    });

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

    console.log("Status IDs to resolve:", Array.from(statusIds));

    // Resolve status names
    const statusNames = await resolveStatusNames(statusIds);
    console.log("Resolved status names:", statusNames);

    // Transform activities
    console.log("=== TRANSFORMING ACTIVITIES ===");
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

    console.log("=== FINAL RESULTS ===");
    console.log("Transformed activities count:", transformedActivities.length);
    if (transformedActivities.length > 0) {
      console.log(
        "First activity sample:",
        JSON.stringify(transformedActivities[0], null, 2)
      );
    } else {
      console.log("No activities to transform");
    }

    console.log("=== API RESPONSE ===");
    console.log("Returning activities count:", transformedActivities.length);
    console.log("Response status: 200 OK");

    return NextResponse.json(transformedActivities);
  } catch (error: unknown) {
    console.error("=== ERROR IN ACTIVITIES API ===");

    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    } else {
      console.error("Unknown error type:", typeof error);
      console.error("Error value:", error);
    }

    console.error("Full error object:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
