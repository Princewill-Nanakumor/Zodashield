// /Users/safeconnection/Downloads/drivecrm/src/app/api/leads/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { executeDbOperation } from "@/libs/dbConfig";
import { authOptions } from "@/libs/auth";
import mongoose from "mongoose";
import Lead from "@/models/Lead";

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
  adminId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

interface TransformedLead {
  _id: string;
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
      const query: { adminId?: mongoose.Types.ObjectId } = {};

      if (session.user.role === "ADMIN") {
        query.adminId = new mongoose.Types.ObjectId(session.user.id);
      } else if (session.user.role === "AGENT" && session.user.adminId) {
        query.adminId = new mongoose.Types.ObjectId(session.user.adminId);
      }

      const [leads, total] = await Promise.all([
        Lead.find(query)
          .select(
            "firstName lastName email phone country source status createdAt updatedAt"
          )
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean<LeadDocument[]>(),
        Lead.countDocuments(query),
      ]);

      const transformedLeads: TransformedLead[] = leads.map(
        (lead: LeadDocument) => ({
          _id: lead._id.toString(),
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
        })
      );
      console.log("�� Returning leads:", {
        count: transformedLeads.length,
        firstLead: transformedLeads[0],
        query: query,
        sessionUser: session.user.id,
      });

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

    const leads = Array.isArray(requestData) ? requestData : [requestData];
    console.log("Received leads to import:", leads.length);

    // Prepare bulk operations
    const operations = leads.map((lead) => ({
      updateOne: {
        filter: {
          email: lead.email.toLowerCase(),
          adminId: new mongoose.Types.ObjectId(session.user.id),
        },
        update: {
          $setOnInsert: {
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.email.toLowerCase(),
            phone: lead.phone || "",
            country: lead.country || "",
            source: lead.source || "-",
            comments: lead.comments || "No comments yet",
            status: lead.status || "NEW",
            importId: lead.importId,
            adminId: new mongoose.Types.ObjectId(session.user.id),
            createdBy: new mongoose.Types.ObjectId(session.user.id),
            createdAt: new Date(),
          },
          $set: {
            updatedAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    let inserted = 0;
    let duplicates = 0;
    let errors = 0;

    try {
      const result = await Lead.bulkWrite(operations, { ordered: false });
      inserted = result.upsertedCount;
      duplicates = leads.length - inserted;
    } catch (error) {
      console.error("Bulk import error:", error);
      errors = leads.length; // fallback, or parse error for more detail
    }

    const importId = leads[0]?.importId;

    if (importId && mongoose.connection && mongoose.connection.db) {
      try {
        await mongoose.connection.db.collection("imports").updateOne(
          { _id: new mongoose.Types.ObjectId(importId) },
          {
            $set: {
              status: "completed",
              successCount: inserted,
              failureCount: duplicates + errors,
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
      inserted,
      duplicates,
      errors,
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
      const query: {
        _id: mongoose.Types.ObjectId;
        adminId?: mongoose.Types.ObjectId;
      } = {
        _id: new mongoose.Types.ObjectId(id),
      };

      if (session.user.role === "ADMIN") {
        query.adminId = new mongoose.Types.ObjectId(session.user.id);
      } else if (session.user.role === "AGENT" && session.user.adminId) {
        query.adminId = new mongoose.Types.ObjectId(session.user.adminId);
      }

      const updatedLead = await Lead.findOneAndUpdate(
        query,
        {
          ...updateData,
          updatedAt: new Date(),
        },
        { new: true }
      ).lean<LeadDocument>();

      if (!updatedLead) {
        return NextResponse.json(
          { error: "Lead not found or not authorized" },
          { status: 404 }
        );
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
      const query: {
        _id: mongoose.Types.ObjectId;
        adminId?: mongoose.Types.ObjectId;
      } = {
        _id: new mongoose.Types.ObjectId(id),
      };

      if (session.user.role === "ADMIN") {
        query.adminId = new mongoose.Types.ObjectId(session.user.id);
      } else if (session.user.role === "AGENT" && session.user.adminId) {
        query.adminId = new mongoose.Types.ObjectId(session.user.adminId);
      }

      const deletedLead =
        await Lead.findOneAndDelete(query).lean<LeadDocument>();

      if (!deletedLead) {
        return NextResponse.json(
          { error: "Lead not found or not authorized" },
          { status: 404 }
        );
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
