// app/api/leads/bulk/delete/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { connectMongoDB } from "@/libs/dbConfig";
import { authOptions } from "@/libs/auth";

interface BulkDeleteRequest {
  leadIds: string[];
}

interface LeadDocument {
  _id: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { leadIds }: BulkDeleteRequest = await request.json();

    if (!leadIds?.length) {
      return NextResponse.json(
        { message: "Invalid request data" },
        { status: 400 }
      );
    }

    await connectMongoDB();

    if (!mongoose.connection.db) {
      throw new Error("Database connection not available");
    }

    const db = mongoose.connection.db;
    const leadObjectIds = leadIds.map((id) => new mongoose.Types.ObjectId(id));
    const adminObjectId = new mongoose.Types.ObjectId(session.user.id);

    // Get leads before deletion with multi-tenancy filter
    const leadsToDelete = (await db
      .collection("leads")
      .find({
        _id: { $in: leadObjectIds },
        adminId: adminObjectId, // Multi-tenancy: only leads belonging to this admin
      })
      .toArray()) as LeadDocument[];

    if (leadsToDelete.length === 0) {
      return NextResponse.json(
        { message: "No valid leads found to delete" },
        { status: 400 }
      );
    }

    const leadIdsToDelete = leadsToDelete.map((lead) => lead._id);

    // Delete leads
    const deleteResult = await db.collection("leads").deleteMany({
      _id: { $in: leadIdsToDelete },
      adminId: adminObjectId, // Additional safety check
    });

    // Also delete associated activities (optional, but recommended for data integrity)
    await db.collection("activities").deleteMany({
      leadId: { $in: leadIdsToDelete },
      adminId: adminObjectId,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${deleteResult.deletedCount} leads`,
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error) {
    console.error("Error in bulk delete endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Error deleting leads",
      },
      { status: 500 }
    );
  }
}

