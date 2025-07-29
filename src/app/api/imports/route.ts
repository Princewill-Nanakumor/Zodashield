// src/app/api/imports/route.ts
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

// Usage limits for trial users
const TRIAL_LIMITS = {
  maxLeads: 50,
  maxUsers: 1,
};

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
    console.log("🔄 POST /api/imports - Starting request processing");
    requestData = await request.json();
    console.log("📄 Request data received:", requestData);
  } catch (error) {
    console.error("❌ Failed to parse request body:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  return executeDbOperation(async () => {
    console.log("🔄 Starting database operation");

    const session = await getServerSession(authOptions);
    console.log("�� Session info:", {
      userId: session?.user?.id,
      userRole: session?.user?.role,
      adminId: session?.user?.adminId,
      isAuthenticated: !!session,
    });

    if (!session?.user?.id) {
      console.error("❌ Unauthorized - No session or user ID");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if database connection is available
    if (!mongoose.connection.db) {
      console.error("❌ Database connection not available");
      throw new Error("Database connection not available");
    }

    console.log("✅ Database connection available");

    // Check usage limits before allowing import
    const adminId =
      session.user.role === "ADMIN" ? session.user.id : session.user.adminId;
    const adminObjectId = new mongoose.Types.ObjectId(adminId!);

    // Get current lead count
    const currentLeads = await mongoose.connection.db
      .collection("leads")
      .countDocuments({ adminId: adminObjectId });

    // Get user subscription status
    const user = await mongoose.connection.db
      .collection("users")
      .findOne({ _id: new mongoose.Types.ObjectId(session.user.id) });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user can import based on subscription/trial status
    const isOnTrial =
      user.isOnTrial &&
      user.trialEndsAt &&
      new Date() < new Date(user.trialEndsAt);
    const hasActiveSubscription = user.subscriptionStatus === "active";
    const maxLeads = user.maxLeads || TRIAL_LIMITS.maxLeads;

    if (!isOnTrial && !hasActiveSubscription) {
      return NextResponse.json(
        {
          error: "Trial expired. Please subscribe to continue importing leads.",
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    if (currentLeads + requestData.recordCount > maxLeads) {
      return NextResponse.json(
        {
          error: "Import would exceed lead limit",
          details: {
            currentLeads,
            maxLeads,
            attemptingToImport: requestData.recordCount,
            remainingSlots: Math.max(0, maxLeads - currentLeads),
          },
          upgradeRequired: true,
        },
        { status: 403 }
      );
    }

    const importData = {
      fileName: requestData.fileName,
      recordCount: requestData.recordCount,
      status: requestData.status || "new",
      successCount: requestData.successCount || 0,
      failureCount: requestData.failureCount || 0,
      timestamp: requestData.timestamp || Date.now(),
      uploadedBy: new mongoose.Types.ObjectId(session.user.id),
      adminId: adminObjectId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log("📝 Creating import record with data:", {
      ...importData,
      uploadedBy: importData.uploadedBy.toString(),
      adminId: importData.adminId.toString(),
    });

    try {
      const importRecord = await mongoose.connection.db
        .collection("imports")
        .insertOne(importData);

      console.log(
        "✅ Import record created with ID:",
        importRecord.insertedId.toString()
      );

      const createdImport = await mongoose.connection.db
        .collection("imports")
        .findOne({ _id: importRecord.insertedId });

      console.log("📄 Created import record:", {
        _id: createdImport!._id.toString(),
        fileName: createdImport!.fileName,
        recordCount: createdImport!.recordCount,
        status: createdImport!.status,
        uploadedBy: createdImport!.uploadedBy.toString(),
        adminId: createdImport!.adminId.toString(),
      });

      const response = {
        data: {
          _id: createdImport!._id.toString(),
          ...createdImport,
        },
        message: "Import record created successfully",
        usage: {
          currentLeads: currentLeads + requestData.recordCount,
          maxLeads,
          remainingLeads: Math.max(
            0,
            maxLeads - (currentLeads + requestData.recordCount)
          ),
        },
      };

      console.log("✅ Returning success response:", response);
      return NextResponse.json(response);
    } catch (dbError) {
      console.error("❌ Database error during import creation:", dbError);
      throw dbError;
    }
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
