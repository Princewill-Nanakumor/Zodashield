// /Users/safeconnection/Downloads/drivecrm/src/app/api/leads/all/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { connectMongoDB } from "@/libs/dbConfig";
import mongoose from "mongoose";
import { Db, ObjectId } from "mongodb";

// Define the user type for the map
interface UserData {
  _id: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
}

// Define query type for MongoDB filters
interface LeadQuery {
  adminId?: ObjectId;
  assignedTo?: ObjectId;
}

// Helper to safely convert ObjectId to string
function safeObjectIdToString(id: unknown): string | null {
  if (!id) return null;
  if (typeof id === "string") return id;
  if (id instanceof ObjectId) return id.toString();
  if (typeof id === "object" && id !== null && "_id" in id) {
    return id._id?.toString() || null;
  }
  return null;
}

// Helper to get user details for assignedTo
async function getAssignedToUser(
  db: Db,
  assignedTo: unknown,
  userMap: Map<string, UserData>
): Promise<{
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
} | null> {
  if (!assignedTo) {
    return null;
  }

  try {
    // If assignedTo is already an object with user details, return it directly
    if (
      typeof assignedTo === "object" &&
      assignedTo !== null &&
      "firstName" in assignedTo &&
      "lastName" in assignedTo
    ) {
      const userObj = assignedTo as {
        _id: unknown;
        firstName: string;
        lastName: string;
      };
      return {
        id: safeObjectIdToString(userObj._id) || "",
        firstName: userObj.firstName,
        lastName: userObj.lastName,
      };
    }

    // If it's a string or ObjectId, look up the user from map first
    const userIdString = safeObjectIdToString(assignedTo);
    if (!userIdString) return null;

    // Check if user is in the map
    const userFromMap = userMap.get(userIdString);
    if (userFromMap) {
      return {
        id: userFromMap._id.toString(),
        firstName: userFromMap.firstName,
        lastName: userFromMap.lastName,
        email: userFromMap.email,
      };
    }

    // Fallback to direct database lookup if not in map
    const userId = new ObjectId(userIdString);
    const user = await db
      .collection("users")
      .findOne(
        { _id: userId },
        { projection: { firstName: 1, lastName: 1, email: 1 } }
      );

    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    };
  } catch (error) {
    console.error("Error getting assigned user:", error);
    return null;
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    await connectMongoDB();

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not available");
    }

    // Build query based on user role
    const query: LeadQuery = {};

    if (session.user.role === "ADMIN") {
      // Admin sees all leads that belong to them (adminId matches their ID)
      query.adminId = new ObjectId(session.user.id);
    } else if (session.user.role === "AGENT") {
      // Agent sees only leads assigned to them
      query.assignedTo = new ObjectId(session.user.id);
    }

    // Fetch leads with multi-tenancy filter
    const leads = await db
      .collection("leads")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    // Collect unique user IDs for batch lookup
    const uniqueUserIds = new Set<string>();
    leads.forEach((lead: Record<string, unknown>) => {
      const assignedTo = lead.assignedTo;
      if (assignedTo) {
        const userIdString = safeObjectIdToString(assignedTo);
        if (userIdString) {
          uniqueUserIds.add(userIdString);
        }
      }
    });

    // Batch fetch users if there are any
    const userMap = new Map<string, UserData>();
    if (uniqueUserIds.size > 0) {
      try {
        const userIds = Array.from(uniqueUserIds).map((id) => new ObjectId(id));
        const users = await db
          .collection("users")
          .find(
            { _id: { $in: userIds } },
            { projection: { firstName: 1, lastName: 1, email: 1 } }
          )
          .toArray();

        users.forEach((user) => {
          userMap.set(user._id.toString(), user as UserData);
        });
      } catch (error) {
        console.error("Error fetching users:", error);
        // Continue without user data rather than failing completely
      }
    }

    // Transform leads
    const transformedLeads = await Promise.all(
      leads.map(async (lead: Record<string, unknown>) => {
        let assignedToUser = null;

        if (lead.assignedTo) {
          // Try to get user details using the user map
          assignedToUser = await getAssignedToUser(
            db as unknown as Db,
            lead.assignedTo,
            userMap
          );
        }

        const transformedLead = {
          _id: safeObjectIdToString(lead._id),
          id: safeObjectIdToString(lead._id),
          firstName: (lead.firstName as string) || "",
          lastName: (lead.lastName as string) || "",
          name: `${(lead.firstName as string) || ""} ${(lead.lastName as string) || ""}`.trim(),
          email: (lead.email as string) || "",
          phone: (lead.phone as string) || "",
          source: (lead.source as string) || "",
          status: (lead.status as string) || "NEW",
          country: (lead.country as string) || "",
          assignedTo: assignedToUser,
          createdAt:
            lead.createdAt instanceof Date
              ? lead.createdAt.toISOString()
              : (lead.createdAt as string) || new Date().toISOString(),
          updatedAt:
            lead.updatedAt instanceof Date
              ? lead.updatedAt.toISOString()
              : (lead.updatedAt as string) || new Date().toISOString(),
          comments: (lead.comments as string) || "",
        };

        return transformedLead;
      })
    );

    return NextResponse.json(transformedLeads);
  } catch (error) {
    console.error("Error fetching leads:", error);

    let errorMessage = "Failed to fetch leads";
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        errorMessage = "Request timed out. Please try again.";
        statusCode = 408;
      } else if (error.message.includes("connection")) {
        errorMessage = "Database connection error. Please try again.";
        statusCode = 503;
      } else if (error.message.includes("Unauthorized")) {
        errorMessage = "Unauthorized access";
        statusCode = 401;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
