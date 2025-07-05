// /src/app/api/leads/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { executeDbOperation } from "@/libs/dbConfig";
import { authOptions } from "@/libs/auth";
import mongoose from "mongoose";

interface MongoDocument {
  _id: mongoose.Types.ObjectId;
  id?: string;
}

interface LeadDocument extends MongoDocument {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  country?: string;
  source?: string;
  status: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

interface ImportLead {
  firstName: string;
  lastName: string;
  email: string;
  country?: string;
  phone?: string;
  source?: string;
  comments?: string;
  status?: string;
  importId?: string;
}

interface TransformedLead {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  source: string;
  country: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "15");
    const skip = (page - 1) * limit;

    return executeDbOperation(async () => {
      // Get the Lead model from mongoose
      const Lead = mongoose.models.Lead;
      if (!Lead) {
        throw new Error("Lead model not found");
      }

      const [leads, total] = await Promise.all([
        Lead.find({})
          .select(
            "firstName lastName email phone country source status createdAt updatedAt"
          )
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean<LeadDocument[]>(),
        Lead.countDocuments({}),
      ]);

      console.log("Raw leads from DB:", leads);

      if (leads.length > 0) {
        console.log("Sample lead:", leads[0]);
      }

      const transformedLeads: TransformedLead[] = leads.map(
        (lead: LeadDocument) => {
          console.log("Processing lead with country:", lead.country);
          return {
            id: lead._id.toString(),
            firstName: lead.firstName,
            lastName: lead.lastName,
            fullName: `${lead.firstName} ${lead.lastName}`,
            email: lead.email,
            phone: lead.phone || "",
            source: lead.source || "",
            country: lead.country || "",
            status: lead.status || "NEW",
            createdAt: new Date(lead.createdAt).toISOString(),
            updatedAt: new Date(lead.updatedAt).toISOString(),
          };
        }
      );

      return NextResponse.json({
        leads: transformedLeads,
        pagination: {
          total,
          pages: Math.ceil(total / limit),
          page,
          limit,
        },
      });
    }, "Error fetching leads");
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let requestData;
  try {
    requestData = await request.json();
  } catch (error) {
    console.error("Error parsing request body:", error);
    return NextResponse.json(
      { error: "Invalid request data" },
      { status: 400 }
    );
  }

  return executeDbOperation(async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the Lead model from mongoose
    const Lead = mongoose.models.Lead;
    if (!Lead) {
      throw new Error("Lead model not found");
    }

    const leads = Array.isArray(requestData) ? requestData : [requestData];
    console.log("Received leads to import:", leads.length);

    if (leads.length > 0) {
      console.log("First lead to be saved:", leads[0]);
    }

    const operations = leads.map((lead: ImportLead) => ({
      updateOne: {
        filter: { email: lead.email },
        update: {
          $set: {
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.email,
            phone: lead.phone || "",
            country: lead.country || "",
            source: lead.source || "-",
            comments: lead.comments || "No comments yet",
            status: lead.status || "NEW",
            importId: lead.importId,
            createdBy: new mongoose.Types.ObjectId(session.user.id),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    const result = await Lead.bulkWrite(operations, { ordered: false });
    const importId = leads[0]?.importId;

    console.log(
      `Inserted ${result.upsertedCount} leads, ${
        leads.length - result.upsertedCount
      } duplicates found`
    );

    if (importId && mongoose.connection && mongoose.connection.db) {
      try {
        await mongoose.connection.db.collection("imports").updateOne(
          { _id: new mongoose.Types.ObjectId(importId) },
          {
            $set: {
              status: "completed",
              successCount: result.upsertedCount,
              failureCount: leads.length - result.upsertedCount,
              updatedAt: new Date(),
            },
          }
        );
      } catch (error) {
        console.error("Error updating import status:", error);
      }
    }

    return NextResponse.json({
      message: "Leads processed",
      inserted: result.upsertedCount,
      duplicates: leads.length - result.upsertedCount,
    });
  }, "Failed to process leads");
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, ...updateData } = await request.json();

    return executeDbOperation(async () => {
      // Get the Lead model from mongoose
      const Lead = mongoose.models.Lead;
      if (!Lead) {
        throw new Error("Lead model not found");
      }

      const updatedLead = await Lead.findByIdAndUpdate(
        id,
        {
          ...updateData,
          updatedAt: new Date(),
        },
        { new: true }
      ).lean<LeadDocument>();

      if (!updatedLead) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }

      return NextResponse.json(updatedLead);
    }, "Error updating lead");
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { error: "Failed to update lead" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Lead ID is required" },
        { status: 400 }
      );
    }

    return executeDbOperation(async () => {
      // Get the Lead model from mongoose
      const Lead = mongoose.models.Lead;
      if (!Lead) {
        throw new Error("Lead model not found");
      }

      const deletedLead = await Lead.findByIdAndDelete(id).lean<LeadDocument>();

      if (!deletedLead) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }

      return NextResponse.json({ message: "Lead deleted successfully" });
    }, "Error deleting lead");
  } catch (error) {
    console.error("Error deleting lead:", error);
    return NextResponse.json(
      { error: "Failed to delete lead" },
      { status: 500 }
    );
  }
}
