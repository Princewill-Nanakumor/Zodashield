// /src/app/api/leads/import/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { connectMongoDB } from "@/libs/dbConfig";
import mongoose from "mongoose";

// Define interface for imported lead data
interface ImportedLead {
  name?: string;
  email: string;
  phone?: string;
  source?: string;
}

// Define interface for transformed lead data
interface TransformedLead {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  source: string;
  status: string;
  createdBy: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId; // Multi-tenancy
  createdAt: Date;
  updatedAt: Date;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    // Check if database connection is available
    if (!mongoose.connection.db) {
      throw new Error("Database connection not available");
    }

    const db = mongoose.connection.db;

    const leads = (await request.json()) as ImportedLead[];
    console.log(
      "Received leads to import:",
      Array.isArray(leads) ? leads.length : 0
    );

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { error: "Invalid data format or empty array" },
        { status: 400 }
      );
    }

    // Transform leads to match your schema with multi-tenancy
    const transformedLeads: TransformedLead[] = leads.map(
      (lead: ImportedLead) => {
        const [firstName, ...rest] = (lead.name || "").split(" ");
        return {
          firstName: firstName || "",
          lastName: rest.join(" ") || "",
          email: lead.email,
          phone: lead.phone || "",
          source: lead.source || "",
          status: "NEW",
          createdBy: new mongoose.Types.ObjectId(session.user.id),
          adminId: new mongoose.Types.ObjectId(session.user.id), // Multi-tenancy: admin owns the leads
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
    );

    console.log("First lead to be saved:", transformedLeads[0]);

    // Save leads in batches
    let results;
    try {
      results = await db
        .collection("leads")
        .insertMany(transformedLeads, { ordered: false });
    } catch (err: unknown) {
      if (err && typeof err === "object" && "writeErrors" in err) {
        // @ts-expect-error: Mongo error type is not known
        const successCount = err.result?.nInserted || 0;
        return NextResponse.json({
          message: `Imported ${successCount} leads, some duplicates were skipped.`,
          totalProcessed: leads.length,
          successCount,
          error: "Some leads were not imported due to duplicates.",
        });
      }
      throw err;
    }

    const insertedCount = results.insertedIds
      ? Object.keys(results.insertedIds).length
      : 0;
    console.log("Saved leads count:", insertedCount);

    return NextResponse.json({
      message: `Successfully imported ${insertedCount} leads`,
      totalProcessed: leads.length,
      successCount: insertedCount,
    });
  } catch (error) {
    console.error("Error in lead import:", error);
    return NextResponse.json(
      {
        error: "Failed to import leads",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
