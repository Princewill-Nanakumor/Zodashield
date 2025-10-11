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
    console.log("🔄 PUT /api/leads/[id] - Starting update");

    const session = await getServerSession(authOptions);
    if (!session) {
      console.log("❌ No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ Session user:", session.user.id, session.user.role);

    const updateData = await request.json();
    console.log("📦 Update data received:", updateData);

    await connectMongoDB();
    const { id } = await params;
    console.log("🎯 Lead ID:", id);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log("❌ Invalid ObjectId format");
      return NextResponse.json({ error: "Invalid lead ID" }, { status: 400 });
    }

    const db = mongoose.connection.db;
    if (!db) {
      console.log("❌ Database connection not available");
      throw new Error("Database connection not available");
    }

    // Build query with multi-tenancy filter
    const query: { _id: ObjectId; adminId?: ObjectId } = {
      _id: new ObjectId(id),
    };

    if (session.user.role === "ADMIN") {
      // Admin can only update leads they created
      query.adminId = new ObjectId(session.user.id);
    } else if (session.user.role === "AGENT" && session.user.adminId) {
      // Agent can only update leads from their admin
      query.adminId = new ObjectId(session.user.adminId);
    }

    console.log("🔍 Query:", query);

    const currentLead = await db.collection("leads").findOne(query);
    console.log("📊 Current lead found:", !!currentLead);

    if (!currentLead) {
      console.log("❌ Lead not found with query");
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
      console.log(
        "📎 Processing assignedTo:",
        updateData.assignedTo,
        typeof updateData.assignedTo
      );

      if (updateData.assignedTo) {
        // Validate it's a valid ObjectId string
        if (!mongoose.Types.ObjectId.isValid(updateData.assignedTo)) {
          console.error(
            "❌ Invalid assignedTo ObjectId:",
            updateData.assignedTo
          );
          return NextResponse.json(
            { error: "Invalid assignedTo user ID" },
            { status: 400 }
          );
        }
        updatePayload.assignedTo = new ObjectId(updateData.assignedTo);
        console.log("✅ assignedTo converted to ObjectId");
      } else {
        updatePayload.assignedTo = null;
        console.log("✅ assignedTo set to null");
      }
    }

    console.log("📝 Update payload:", JSON.stringify(updatePayload, null, 2));

    // First, perform the update
    const updateResult = await db
      .collection("leads")
      .updateOne(query, { $set: updatePayload });

    console.log("📊 Update result:", {
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount,
      acknowledged: updateResult.acknowledged,
    });

    if (updateResult.matchedCount === 0) {
      console.log("❌ No lead matched the query");
      return NextResponse.json(
        { error: "Lead not found or not authorized" },
        { status: 404 }
      );
    }

    // ⚠️ CRITICAL: Check if document was actually modified
    if (updateResult.modifiedCount === 0) {
      console.error("❌ CRITICAL: Lead matched but NOT modified in database!");
      console.error(
        "📝 Attempted payload:",
        JSON.stringify(updatePayload, null, 2)
      );
      console.error(
        "📄 Current document:",
        JSON.stringify(currentLead, null, 2)
      );

      // Compare to see what changed
      const changes: string[] = [];
      Object.keys(updatePayload).forEach((key) => {
        if (key !== "updatedAt" && currentLead[key] !== updatePayload[key]) {
          changes.push(
            `${key}: "${currentLead[key]}" → "${updatePayload[key]}"`
          );
        }
      });

      console.error(
        "🔍 Detected changes:",
        changes.length > 0 ? changes : "None (data is identical)"
      );

      // If there were supposed to be changes but nothing was modified, that's an error
      if (changes.length > 0) {
        return NextResponse.json(
          {
            error: "Database update failed - no changes were saved",
            details:
              "The update operation completed but no fields were modified in the database. This may indicate a database constraint or validation error.",
            attemptedChanges: changes,
          },
          { status: 500 }
        );
      }

      console.warn("⚠️ No actual changes detected - data is identical");
    } else {
      console.log(
        `✅ Document successfully modified! Changed ${updateResult.modifiedCount} document(s)`
      );
    }

    // Then fetch the updated document to verify changes
    const updatedLead = await db.collection("leads").findOne(query);

    if (!updatedLead || !updatedLead._id) {
      console.log("❌ Could not retrieve updated lead");
      return NextResponse.json(
        { error: "Failed to retrieve updated lead" },
        { status: 500 }
      );
    }

    console.log("✅ Updated lead document retrieved:", {
      id: updatedLead._id.toString(),
      firstName: updatedLead.firstName,
      email: updatedLead.email,
      phone: updatedLead.phone,
      country: updatedLead.country,
      source: updatedLead.source,
    });

    // ✅ VERIFY: Check that the changes were actually saved
    const verificationErrors: string[] = [];
    if (
      updatePayload.firstName &&
      updatedLead.firstName !== updatePayload.firstName
    ) {
      verificationErrors.push(
        `firstName not saved: expected "${updatePayload.firstName}", got "${updatedLead.firstName}"`
      );
    }
    if (
      updatePayload.lastName &&
      updatedLead.lastName !== updatePayload.lastName
    ) {
      verificationErrors.push(
        `lastName not saved: expected "${updatePayload.lastName}", got "${updatedLead.lastName}"`
      );
    }
    if (updatePayload.email && updatedLead.email !== updatePayload.email) {
      verificationErrors.push(
        `email not saved: expected "${updatePayload.email}", got "${updatedLead.email}"`
      );
    }
    if (updatePayload.phone && updatedLead.phone !== updatePayload.phone) {
      verificationErrors.push(
        `phone not saved: expected "${updatePayload.phone}", got "${updatedLead.phone}"`
      );
    }
    if (
      updatePayload.country &&
      updatedLead.country !== updatePayload.country
    ) {
      verificationErrors.push(
        `country not saved: expected "${updatePayload.country}", got "${updatedLead.country}"`
      );
    }

    if (verificationErrors.length > 0) {
      console.error(
        "❌ VERIFICATION FAILED: Changes not reflected in database!"
      );
      console.error(verificationErrors);
      return NextResponse.json(
        {
          error: "Update verification failed",
          details: "Changes were not properly saved to the database",
          verificationErrors,
        },
        { status: 500 }
      );
    }

    console.log(
      "✅ VERIFICATION PASSED: All changes successfully saved to database"
    );

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

    console.log("✅ Transformed lead to return:", transformedLead);
    console.log("✅ Returning transformed lead");
    return NextResponse.json(transformedLead);
  } catch (error) {
    console.error("❌ CATCH BLOCK - Error updating lead:", error);
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      fullError: error,
    });
    return NextResponse.json(
      {
        error: "Failed to update lead",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
