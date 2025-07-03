// /Users/safeconnection/Downloads/drivecrm-main/src/app/api/leads/all/route.ts
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
  console.log("🔍 getAssignedToUser called with:", assignedTo);

  if (!assignedTo) {
    console.log("❌ assignedTo is null/undefined, returning null");
    return null;
  }

  try {
    const user = await db.collection("users").findOne(
      {
        _id:
          typeof assignedTo === "string"
            ? new ObjectId(assignedTo)
            : assignedTo,
      },
      { projection: { firstName: 1, lastName: 1 } }
    );

    if (!user) {
      console.log("❌ User not found for assignedTo:", assignedTo);
      return null;
    }

    const result = {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
    };

    console.log("✅ Found user:", result);
    return result;
  } catch (error) {
    console.error("❌ Error getting assigned user:", error);
    return null;
  }
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

    console.log("=== API LEADS ALL DEBUG ===");

    const leads = await db
      .collection("leads")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    console.log("Raw leads count:", leads.length);

    // Debug the first few leads to see their assignedTo values
    const sampleLeads = leads.slice(0, 5);
    console.log("Sample leads assignedTo values:");
    sampleLeads.forEach((lead, index) => {
      console.log(`Lead ${index + 1}:`, {
        id: lead._id?.toString(),
        name: `${lead.firstName} ${lead.lastName}`,
        assignedTo: lead.assignedTo,
        assignedToType: typeof lead.assignedTo,
        isObjectId: lead.assignedTo instanceof ObjectId,
      });
    });

    // Count how many leads have assignedTo values
    const leadsWithAssignment = leads.filter((lead) => lead.assignedTo).length;
    const leadsWithoutAssignment = leads.filter(
      (lead) => !lead.assignedTo
    ).length;

    console.log(
      `📊 Assignment stats: ${leadsWithAssignment} assigned, ${leadsWithoutAssignment} unassigned`
    );

    // Populate assignedTo for each lead
    const transformedLeads = await Promise.all(
      leads.map(async (lead: Record<string, unknown>) => {
        const assignedToUser = await getAssignedToUser(
          db,
          lead.assignedTo as ObjectId | string | null | undefined
        );

        const transformedLead = {
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
          assignedTo: assignedToUser, // This will be { id, firstName, lastName } or null
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

        return transformedLead;
      })
    );

    console.log("Transformed leads count:", transformedLeads.length);

    // Debug the first few transformed leads
    const sampleTransformed = transformedLeads.slice(0, 3);
    console.log("Sample transformed leads:");
    sampleTransformed.forEach((lead, index) => {
      console.log(`Transformed Lead ${index + 1}:`, {
        id: lead._id,
        name: lead.name,
        assignedTo: lead.assignedTo,
        assignedToType: typeof lead.assignedTo,
      });
    });

    return NextResponse.json(transformedLeads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}
