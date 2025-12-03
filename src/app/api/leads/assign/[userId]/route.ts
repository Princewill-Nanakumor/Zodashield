// src/app/api/leads/assign/[userId]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import { authOptions } from "@/libs/auth";
import mongoose from "mongoose";

interface LeadDocument {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  country?: string;
  value?: number;
  source?: string;
  status: string;
  comments?: string;
  company?: string;
  assignedTo?: {
    _id: mongoose.Types.ObjectId;
    firstName: string;
    lastName: string;
  };
  assignedAt?: Date;
  adminId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

interface TransformedLead {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone?: string;
  country?: string;
  value?: number;
  source?: string;
  status: string;
  comments?: string;
  company?: string;
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  assignedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Keep your existing GET method
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    // Check if database connection is available
    if (!mongoose.connection.db) {
      throw new Error("Database connection not available");
    }

    // Build query based on user role for multi-tenancy
    const query: {
      "assignedTo._id": string;
      adminId?: mongoose.Types.ObjectId;
    } = {
      "assignedTo._id": session.user.id,
    };

    if (session.user.role === "AGENT" && session.user.adminId) {
      // Agent sees only leads from their admin
      query.adminId = new mongoose.Types.ObjectId(session.user.adminId);
    } else if (session.user.role === "ADMIN") {
      // Admin sees only leads they created
      query.adminId = new mongoose.Types.ObjectId(session.user.id);
    }

    const leads = (await mongoose.connection.db
      .collection("leads")
      .find(query)
      .sort({ createdAt: -1 })
      .toArray()) as LeadDocument[];

    const transformedLeads: TransformedLead[] = leads.map((lead) => ({
      id: lead._id.toString(),
      firstName: lead.firstName,
      lastName: lead.lastName,
      name: `${lead.firstName} ${lead.lastName}`,
      email: lead.email,
      phone: lead.phone,
      country: lead.country,
      value: lead.value,
      source: lead.source && lead.source !== "-" ? lead.source : "—",
      status: lead.status,
      comments: lead.comments,
      company: lead.company,
      assignedTo: lead.assignedTo
        ? {
            _id: lead.assignedTo._id.toString(),
            firstName: lead.assignedTo.firstName,
            lastName: lead.assignedTo.lastName,
          }
        : undefined,
      assignedAt: lead.assignedAt,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
    }));

    return NextResponse.json(transformedLeads);
  } catch (error) {
    console.error("Error fetching assigned leads:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// Add the POST method for assigning leads
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { leadIds, userId } = await request.json();

    if (!leadIds || !userId || !Array.isArray(leadIds)) {
      return NextResponse.json(
        { message: "Invalid request data" },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // Check if database connection is available
    if (!mongoose.connection.db) {
      throw new Error("Database connection not available");
    }

    const adminObjectId = new mongoose.Types.ObjectId(session.user.id);

    // Update all selected leads with multi-tenancy filter
    const updateResult = await mongoose.connection.db
      .collection("leads")
      .updateMany(
        {
          _id: { $in: leadIds.map((id) => new mongoose.Types.ObjectId(id)) },
          adminId: adminObjectId, // Only leads belonging to this admin
        },
        {
          $set: {
            assignedTo: {
              id: userId,
              assignedAt: new Date(),
            },
            status: "CONTACTED", // Or whatever status you want to set when assigned
            updatedAt: new Date(),
          },
        }
      );

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { message: "No leads were updated" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: `Successfully assigned ${updateResult.modifiedCount} leads`,
      modifiedCount: updateResult.modifiedCount,
    });
  } catch (error) {
    console.error("Error assigning leads:", error);
    return NextResponse.json(
      { message: "Error assigning leads" },
      { status: 500 }
    );
  }
}
