// src/app/api/imports/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { executeDbOperation } from "@/libs/dbConfig";
import { authOptions } from "@/libs/auth";
import mongoose from "mongoose";

export async function GET() {
  return executeDbOperation(async () => {
    // Check if database connection is available
    if (!mongoose.connection.db) {
      throw new Error("Database connection not available");
    }

    const imports = await mongoose.connection.db
      .collection("imports")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ imports });
  }, "Failed to fetch imports");
}

export async function POST(request: Request) {
  let requestData;
  try {
    requestData = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  return executeDbOperation(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if database connection is available
    if (!mongoose.connection.db) {
      throw new Error("Database connection not available");
    }

    console.log("Creating import with data:", {
      ...requestData,
      uploadedBy: session.user.id,
    });

    const importRecord = await mongoose.connection.db
      .collection("imports")
      .insertOne({
        fileName: requestData.fileName,
        recordCount: requestData.recordCount,
        status: requestData.status || "new",
        successCount: requestData.successCount || 0,
        failureCount: requestData.failureCount || 0,
        timestamp: requestData.timestamp || Date.now(),
        uploadedBy: new mongoose.Types.ObjectId(session.user.id),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

    const createdImport = await mongoose.connection.db
      .collection("imports")
      .findOne({ _id: importRecord.insertedId });

    return NextResponse.json({
      data: {
        _id: createdImport!._id.toString(),
        ...createdImport,
      },
      message: "Import record created successfully",
    });
  }, "Failed to create import");
}

export async function DELETE(request: Request) {
  return executeDbOperation(async () => {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!mongoose.connection.db) {
      throw new Error("Database connection not available");
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      // Delete single import and its leads
      const importRecord = await mongoose.connection.db
        .collection("imports")
        .findOne({ _id: new mongoose.Types.ObjectId(id) });

      if (!importRecord) {
        return NextResponse.json(
          { error: "Import not found" },
          { status: 404 }
        );
      }

      // Match both string and ObjectId for importId
      const objectId = new mongoose.Types.ObjectId(id);
      const deleteLeadsResult = await mongoose.connection.db
        .collection("leads")
        .deleteMany({
          $or: [{ importId: id }, { importId: objectId }],
        });

      await mongoose.connection.db
        .collection("imports")
        .deleteOne({ _id: objectId });

      return NextResponse.json({
        message: "Import and associated leads deleted",
        deletedLeads: deleteLeadsResult.deletedCount,
      });
    } else {
      // Delete all imports and leads
      await mongoose.connection.db.collection("leads").deleteMany({});
      await mongoose.connection.db.collection("imports").deleteMany({});
      return NextResponse.json({ message: "All imports and leads deleted" });
    }
  }, "Failed to delete imports");
}
