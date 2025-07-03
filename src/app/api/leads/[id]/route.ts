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
  const user = await db.collection("users").findOne(
    {
      _id:
        typeof assignedTo === "string" ? new ObjectId(assignedTo) : assignedTo,
    },
    { projection: { firstName: 1, lastName: 1 } }
  );
  if (!user) return null;
  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
  };
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

    const lead = await db
      .collection("leads")
      .findOne({ _id: new ObjectId(id) });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const assignedToUser = await getAssignedToUser(db, lead.assignedTo);

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
      assignedTo: assignedToUser,
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
    if (!db) throw new Error("Database connection not available");

    const currentLead = await db
      .collection("leads")
      .findOne({ _id: new ObjectId(id) });

    if (!currentLead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    // Prepare the update payload
    const updatePayload: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (updateData.firstName !== undefined)
      updatePayload.firstName = updateData.firstName;
    if (updateData.lastName !== undefined)
      updatePayload.lastName = updateData.lastName;
    if (updateData.email !== undefined) updatePayload.email = updateData.email;
    if (updateData.phone !== undefined) updatePayload.phone = updateData.phone;
    if (updateData.source !== undefined)
      updatePayload.source = updateData.source;
    if (updateData.status !== undefined)
      updatePayload.status = updateData.status;
    if (updateData.country !== undefined)
      updatePayload.country = updateData.country;
    if (updateData.comments !== undefined)
      updatePayload.comments = updateData.comments;
    if (updateData.assignedTo !== undefined) {
      updatePayload.assignedTo = updateData.assignedTo
        ? new ObjectId(updateData.assignedTo)
        : null;
    }

    const result = await db
      .collection("leads")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updatePayload },
        { returnDocument: "after" }
      );

    if (!result || !result.value) {
      return NextResponse.json(
        { error: "Failed to update lead" },
        { status: 500 }
      );
    }

    const assignedToUser = await getAssignedToUser(db, result.value.assignedTo);

    const transformedLead = {
      _id: result.value._id.toString(),
      id: result.value._id.toString(),
      firstName: result.value.firstName,
      lastName: result.value.lastName,
      name: `${result.value.firstName} ${result.value.lastName}`,
      email: result.value.email,
      phone: result.value.phone || "",
      source: result.value.source,
      status: result.value.status,
      country: result.value.country || "",
      assignedTo: assignedToUser,
      createdAt:
        result.value.createdAt instanceof Date
          ? result.value.createdAt.toISOString()
          : result.value.createdAt,
      updatedAt:
        result.value.updatedAt instanceof Date
          ? result.value.updatedAt.toISOString()
          : result.value.updatedAt,
      comments: result.value.comments || "",
    };

    return NextResponse.json(transformedLead);
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    );
  }
}
