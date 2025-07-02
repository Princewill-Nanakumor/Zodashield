// src/app/api/imports/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { executeDbOperation } from "@/libs/dbConfig";
import Import from "@/models/Import";
import { authOptions } from "@/libs/auth";
import Lead from "@/models/Lead";

export async function GET() {
  return executeDbOperation(async () => {
    const imports = await Import.find().sort({ createdAt: -1 });
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

    console.log("Creating import with data:", {
      ...requestData,
      uploadedBy: session.user.id, // Changed to uploadedBy to match schema
    });

    const importRecord = await Import.create({
      fileName: requestData.fileName,
      recordCount: requestData.recordCount,
      status: requestData.status || "new",
      successCount: requestData.successCount || 0,
      failureCount: requestData.failureCount || 0,
      timestamp: requestData.timestamp || Date.now(),
      uploadedBy: session.user.id, // Changed to uploadedBy to match schema
    });

    return NextResponse.json({
      data: {
        _id: importRecord._id.toString(),
        ...importRecord.toObject(),
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      // Delete single import and its leads
      const importRecord = await Import.findById(id);
      if (!importRecord) {
        return NextResponse.json(
          { error: "Import not found" },
          { status: 404 }
        );
      }
      await Lead.deleteMany({ importId: id });
      await Import.findByIdAndDelete(id);
      return NextResponse.json({
        message: "Import and associated leads deleted",
      });
    } else {
      // Delete all imports and leads
      await Lead.deleteMany({});
      await Import.deleteMany({});
      return NextResponse.json({ message: "All imports and leads deleted" });
    }
  }, "Failed to delete imports");
}
