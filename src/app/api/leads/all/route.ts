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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection not available");

    const leads = await db
      .collection("leads")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    // Populate assignedTo for each lead
    const transformedLeads = await Promise.all(
      leads.map(async (lead: Record<string, unknown>) => {
        const assignedToUser = await getAssignedToUser(
          db,
          lead.assignedTo as ObjectId | string | null | undefined
        );
        return {
          _id: lead._id?.toString(),
          id: lead._id?.toString(),
          firstName: lead.firstName as string,
          lastName: lead.lastName as string,
          name: `${lead.firstName as string} ${lead.lastName as string}`,
          email: lead.email as string,
          phone: (lead.phone as string) || "",
          source: lead.source as string,
          status: lead.status as string,
          country: (lead.country as string) || "",
          assignedTo: assignedToUser,
          createdAt:
            lead.createdAt instanceof Date
              ? lead.createdAt.toISOString()
              : lead.createdAt,
          updatedAt:
            lead.updatedAt instanceof Date
              ? lead.updatedAt.toISOString()
              : lead.updatedAt,
          comments: (lead.comments as string) || "",
        };
      })
    );

    return NextResponse.json(transformedLeads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}
