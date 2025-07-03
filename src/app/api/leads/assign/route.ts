// app/api/leads/assign/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { connectMongoDB } from "@/libs/dbConfig";
import { authOptions } from "@/libs/auth";

// Define the return type for the assignment function
interface AssignmentResult {
  success: boolean;
  message: string;
  modifiedCount: number;
}

// Request deduplication with proper typing
const pendingAssignments = new Map<string, Promise<AssignmentResult>>();

interface AssignLeadsRequest {
  leadIds: string[];
  userId: string;
  leadsData?: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    source: string;
    status: string;
    country: string;
    comments?: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { leadIds, userId, leadsData }: AssignLeadsRequest =
      await request.json();

    if (!leadIds?.length || !userId) {
      return NextResponse.json(
        { message: "Invalid request data" },
        { status: 400 }
      );
    }

    // Create a unique key for this assignment request
    const assignmentKey = `${leadIds.sort().join(",")}_${userId}`;

    // Check if this assignment is already in progress
    if (pendingAssignments.has(assignmentKey)) {
      return NextResponse.json(
        { message: "Assignment already in progress" },
        { status: 409 }
      );
    }

    // Create the assignment promise
    const assignmentPromise = performAssignment(
      leadIds,
      userId,
      leadsData,
      session.user.id
    );
    pendingAssignments.set(assignmentKey, assignmentPromise);

    try {
      const result = await assignmentPromise;
      return NextResponse.json(result);
    } finally {
      // Clean up the pending assignment
      pendingAssignments.delete(assignmentKey);
    }
  } catch (error) {
    console.error("Error in assign endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Error assigning leads",
      },
      { status: 500 }
    );
  }
}

async function performAssignment(
  leadIds: string[],
  userId: string,
  leadsData: AssignLeadsRequest["leadsData"],
  assignedById: string
): Promise<AssignmentResult> {
  await connectMongoDB();

  // Check if database connection is available
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Database connection not available");
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const leadObjectIds = leadIds.map((id) => new mongoose.Types.ObjectId(id));

  // Get leads before update
  const beforeLeads = await db
    .collection("leads")
    .find({ _id: { $in: leadObjectIds } })
    .toArray();

  // Get user details
  const [assignedToUser, assignedByUser] = await Promise.all([
    db
      .collection("users")
      .findOne(
        { _id: userObjectId },
        { projection: { firstName: 1, lastName: 1 } }
      ),
    db
      .collection("users")
      .findOne(
        { _id: new mongoose.Types.ObjectId(assignedById) },
        { projection: { firstName: 1, lastName: 1 } }
      ),
  ]);

  if (!assignedToUser) {
    throw new Error("Target user not found");
  }

  if (!assignedByUser) {
    throw new Error("Assigned by user not found");
  }

  // Update leads and create activities
  const updatePromises = beforeLeads.map(async (lead) => {
    const leadData = leadsData?.find((l) => l._id === lead._id.toString());
    const oldAssignedTo = lead.assignedTo;
    const isReassignment = !!oldAssignedTo;

    // Check if assignment is actually changing
    if (oldAssignedTo && oldAssignedTo.toString() === userId) {
      return lead; // No change needed
    }

    // Update lead
    const updateData = leadData
      ? {
          ...leadData,
          assignedTo: userObjectId,
          updatedAt: new Date(),
        }
      : {
          assignedTo: userObjectId,
          updatedAt: new Date(),
        };

    const updatedLead = await db
      .collection("leads")
      .findOneAndUpdate(
        { _id: lead._id },
        { $set: updateData },
        { returnDocument: "after" }
      );

    // Create activity only if assignment actually changed
    const activityData = {
      type: "ASSIGNMENT",
      userId: new mongoose.Types.ObjectId(assignedById),
      details: isReassignment
        ? `Lead reassigned from ${oldAssignedTo ? "Previous User" : "Unknown"} to ${assignedToUser.firstName} ${assignedToUser.lastName}`
        : `Lead assigned to ${assignedToUser.firstName} ${assignedToUser.lastName}`,
      leadId: lead._id,
      timestamp: new Date(),
      metadata: {
        assignedTo: {
          id: assignedToUser._id.toString(),
          firstName: assignedToUser.firstName,
          lastName: assignedToUser.lastName,
        },
        assignedFrom: oldAssignedTo ? { id: oldAssignedTo.toString() } : null,
        assignedBy: {
          id: assignedByUser._id.toString(),
          firstName: assignedByUser.firstName,
          lastName: assignedByUser.lastName,
        },
      },
    };

    await db.collection("activities").insertOne(activityData);

    return updatedLead;
  });

  const results = await Promise.all(updatePromises);
  const actualUpdates = results.filter((lead) => lead !== null);

  return {
    success: true,
    message: `Successfully assigned ${actualUpdates.length} leads`,
    modifiedCount: actualUpdates.length,
  };
}
