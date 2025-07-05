// /Users/safeconnection/Downloads/drivecrm-main/src/app/api/imports/[importId]/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { connectMongoDB } from "@/libs/dbConfig";
import mongoose from "mongoose";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ importId: string }> }
) {
  try {
    const { importId } = await params;

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    // Check if database connection is available
    if (!mongoose.connection.db) {
      throw new Error("Database connection not available");
    }

    // Delete all leads that were imported with this importId
    const result = await mongoose.connection.db
      .collection("leads")
      .deleteMany({ importId: importId });

    return NextResponse.json({
      message: `Deleted ${result.deletedCount} leads from import ${importId}`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting leads by import ID:", error);
    return NextResponse.json(
      {
        error: "Failed to delete leads",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
