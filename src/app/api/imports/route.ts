import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { executeDbOperation } from "@/libs/dbConfig";
import { authOptions } from "@/libs/auth";
import mongoose from "mongoose";

// Define query types for MongoDB filters
interface ImportQuery {
  uploadedBy?: mongoose.Types.ObjectId;
  _id?: mongoose.Types.ObjectId;
}

interface LeadsQuery {
  $or: Array<{ importId: string | mongoose.Types.ObjectId }>;
  adminId?: mongoose.Types.ObjectId;
}

export async function GET() {
  return executeDbOperation(async () => {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if database connection is available
    if (!mongoose.connection.db) {
      throw new Error("Database connection not available");
    }

    // Build query based on user role for multi-tenancy
    const query: ImportQuery = {};

    if (session.user.role === "ADMIN") {
      // Admin sees only imports they created
      query.uploadedBy = new mongoose.Types.ObjectId(session.user.id);
    } else if (session.user.role === "AGENT" && session.user.adminId) {
      // Agent sees imports from their admin
      query.uploadedBy = new mongoose.Types.ObjectId(session.user.adminId);
    }

    const imports = await mongoose.connection.db
      .collection("imports")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ imports });
  }, "Failed to fetch imports");
}

export async function POST(request: Request) {
  let requestData: {
    fileName: string;
    recordCount: number;
    status?: string;
    successCount?: number;
    failureCount?: number;
    timestamp?: number;
  };

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
        adminId:
          session.user.role === "ADMIN"
            ? new mongoose.Types.ObjectId(session.user.id)
            : new mongoose.Types.ObjectId(session.user.adminId!), // Multi-tenancy
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
      // Delete single import and its leads with multi-tenancy filter
      const query: ImportQuery = { _id: new mongoose.Types.ObjectId(id) };

      if (session.user.role === "ADMIN") {
        // Admin can only delete imports they created
        query.uploadedBy = new mongoose.Types.ObjectId(session.user.id);
      } else if (session.user.role === "AGENT" && session.user.adminId) {
        // Agent can only delete imports from their admin
        query.uploadedBy = new mongoose.Types.ObjectId(session.user.adminId);
      }

      const importRecord = await mongoose.connection.db
        .collection("imports")
        .findOne(query);

      if (!importRecord) {
        return NextResponse.json(
          { error: "Import not found" },
          { status: 404 }
        );
      }

      // Delete leads with multi-tenancy filter
      const leadsQuery: LeadsQuery = {
        $or: [{ importId: id }, { importId: new mongoose.Types.ObjectId(id) }],
      };

      // Add adminId filter for multi-tenancy
      if (session.user.role === "ADMIN") {
        leadsQuery.adminId = new mongoose.Types.ObjectId(session.user.id);
      } else if (session.user.role === "AGENT" && session.user.adminId) {
        leadsQuery.adminId = new mongoose.Types.ObjectId(session.user.adminId);
      }

      const deleteLeadsResult = await mongoose.connection.db
        .collection("leads")
        .deleteMany(leadsQuery);

      await mongoose.connection.db.collection("imports").deleteOne(query);

      return NextResponse.json({
        message: "Import and associated leads deleted",
        deletedLeads: deleteLeadsResult.deletedCount,
      });
    } else {
      // Delete all imports and leads for the current admin only
      const adminId =
        session.user.role === "ADMIN" ? session.user.id : session.user.adminId;

      if (!adminId) {
        return NextResponse.json(
          { error: "Admin ID not found" },
          { status: 400 }
        );
      }

      const adminObjectId = new mongoose.Types.ObjectId(adminId);

      // Delete leads for this admin only
      const deleteLeadsResult = await mongoose.connection.db
        .collection("leads")
        .deleteMany({ adminId: adminObjectId });

      // Delete imports for this admin only
      const deleteImportsResult = await mongoose.connection.db
        .collection("imports")
        .deleteMany({ adminId: adminObjectId });

      return NextResponse.json({
        message: "All imports and leads deleted for this admin",
        deletedLeads: deleteLeadsResult.deletedCount,
        deletedImports: deleteImportsResult.deletedCount,
      });
    }
  }, "Failed to delete imports");
}
