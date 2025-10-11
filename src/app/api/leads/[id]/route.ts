// /Users/safeconnection/Downloads/drivecrm-main/src/app/api/leads/[id]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { connectMongoDB } from "@/libs/dbConfig";
import mongoose from "mongoose";
import { Db, ObjectId } from "mongodb";

// Helper to get user details for assignedTo
async function getAssignedToUser(
  db: Db,
  assignedTo: ObjectId | string | null | undefined
) {
  if (!assignedTo) return null;

  try {
    const user = await db.collection("users").findOne(
      {
        _id:
          typeof assignedTo === "string"
            ? new ObjectId(assignedTo)
            : assignedTo,
      },
      { projection: { firstName: 1, lastName: 1, email: 1 } }
    );

    if (!user) return null;

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

// GET /api/leads/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });
    }

    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection not available");

    // Build query with multi-tenancy filter
    const query: { _id: ObjectId; adminId?: ObjectId } = {
      _id: new ObjectId(id),
    };

    if (session.user.role === "ADMIN") {
      // Admin can only see leads they created
      query.adminId = new ObjectId(session.user.id);
    } else if (session.user.role === "AGENT" && session.user.adminId) {
      // Agent can only see leads from their admin
      query.adminId = new ObjectId(session.user.adminId);
    }

    const lead = await db.collection("leads").findOne(query);

    if (!lead) {
      return NextResponse.json(
        { error: "Lead not found or not authorized" },
        { status: 404 }
      );
    }

    // Populate assignedTo with user details
    const assignedToUser = await getAssignedToUser(
      db as unknown as Db,
      lead.assignedTo
    );

    const transformedLead = {
      _id: lead._id.toString(),
      id: lead._id.toString(),
      firstName: lead.firstName,
      lastName: lead.lastName,
      name: `${lead.firstName} ${lead.lastName}`,
      email: lead.email,
      phone: lead.phone || "",
      source: lead.source,
      status: lead.status,
      country: lead.country || "",
      assignedTo: assignedToUser, // This will be { id, firstName, lastName, email } or null
      createdAt:
        lead.createdAt instanceof Date
          ? lead.createdAt.toISOString()
          : lead.createdAt,
      updatedAt:
        lead.updatedAt instanceof Date
          ? lead.updatedAt.toISOString()
          : lead.updatedAt,
      comments: lead.comments || "",
    };

    return NextResponse.json(transformedLead);
  } catch (error) {
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      { error: "Failed to fetch lead" },
      { status: 500 }
    );
  }
}

// PUT /api/leads/[id]
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updateData = await request.json();
    await connectMongoDB();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });
    }

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not available");
    }

    // Build query with multi-tenancy filter
    const query: { _id: ObjectId; adminId?: ObjectId } = {
      _id: new ObjectId(id),
    };

    if (session.user.role === "ADMIN") {
      query.adminId = new ObjectId(session.user.id);
    } else if (session.user.role === "AGENT" && session.user.adminId) {
      query.adminId = new ObjectId(session.user.adminId);
    }

    const currentLead = await db.collection("leads").findOne(query);

    if (!currentLead) {
      return NextResponse.json(
        { error: "Lead not found or not authorized" },
        { status: 404 }
      );
    }

    // Prepare the update payload
    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (updateData.firstName !== undefined)
      updatePayload.firstName = String(updateData.firstName || "").trim();
    if (updateData.lastName !== undefined)
      updatePayload.lastName = String(updateData.lastName || "").trim();
    if (updateData.email !== undefined) {
      // ✅ FIX: Lowercase email to match schema and prevent duplicate key errors
      updatePayload.email = String(updateData.email || "")
        .toLowerCase()
        .trim();
      console.log("📧 Email normalized:", updatePayload.email);
    }
    if (updateData.phone !== undefined)
      updatePayload.phone = String(updateData.phone || "").trim();
    if (updateData.source !== undefined)
      updatePayload.source = String(updateData.source || "").trim();
    if (updateData.status !== undefined)
      updatePayload.status = updateData.status;
    if (updateData.country !== undefined)
      updatePayload.country = String(updateData.country || "").trim();
    if (updateData.comments !== undefined)
      updatePayload.comments = updateData.comments;

    // Handle assignedTo field
    if (updateData.assignedTo !== undefined) {
      if (updateData.assignedTo) {
        if (!mongoose.Types.ObjectId.isValid(updateData.assignedTo)) {
          return NextResponse.json(
            { error: "Invalid assignedTo user ID" },
            { status: 400 }
          );
        }
        updatePayload.assignedTo = new ObjectId(updateData.assignedTo);
      } else {
        updatePayload.assignedTo = null;
      }
    }

    // Perform the update
    const updateResult = await db
      .collection("leads")
      .updateOne(query, { $set: updatePayload });

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: "Lead not found or not authorized" },
        { status: 404 }
      );
    }

    // Check if document was actually modified
    if (updateResult.modifiedCount === 0) {
      const changes: string[] = [];
      Object.keys(updatePayload).forEach((key) => {
        if (key !== "updatedAt" && currentLead[key] !== updatePayload[key]) {
          changes.push(
            `${key}: "${currentLead[key]}" → "${updatePayload[key]}"`
          );
        }
      });

      // If there were supposed to be changes but nothing was modified, that's an error
      if (changes.length > 0) {
        console.error("Lead update failed - changes not saved:", changes);
        return NextResponse.json(
          {
            error: "Database update failed - no changes were saved",
            details:
              "The update operation completed but no fields were modified in the database.",
            attemptedChanges: changes,
          },
          { status: 500 }
        );
      }
    }

    // Fetch the updated document
    const updatedLead = await db.collection("leads").findOne(query);

    if (!updatedLead || !updatedLead._id) {
      return NextResponse.json(
        { error: "Failed to retrieve updated lead" },
        { status: 500 }
      );
    }

    // Populate assignedTo with user details for the response
    const assignedToUser = await getAssignedToUser(
      db as unknown as Db,
      updatedLead.assignedTo
    );

    const transformedLead = {
      _id: updatedLead._id.toString(),
      id: updatedLead._id.toString(),
      firstName: updatedLead.firstName,
      lastName: updatedLead.lastName,
      name: `${updatedLead.firstName} ${updatedLead.lastName}`,
      email: updatedLead.email,
      phone: updatedLead.phone || "",
      source: updatedLead.source,
      status: updatedLead.status,
      country: updatedLead.country || "",
      assignedTo: assignedToUser,
      createdAt:
        updatedLead.createdAt instanceof Date
          ? updatedLead.createdAt.toISOString()
          : updatedLead.createdAt,
      updatedAt:
        updatedLead.updatedAt instanceof Date
          ? updatedLead.updatedAt.toISOString()
          : updatedLead.updatedAt,
      comments: updatedLead.comments || "",
    };

    return NextResponse.json(transformedLead);
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      {
        error: "Failed to update lead",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
