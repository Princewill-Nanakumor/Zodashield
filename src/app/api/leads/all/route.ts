// src/app/api/leads/all/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import Lead, { ILead } from "@/models/Lead";
import { authOptions } from "@/libs/auth";

interface PopulatedUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
}

interface PopulatedLead extends Omit<ILead, "assignedTo"> {
  assignedTo?: PopulatedUser | null;
}

export async function GET() {
  console.log("GET request received at /api/leads/all");

  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      console.log("Unauthorized attempt - no session");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    // Enhanced query with proper filtering and population
    const query =
      session.user.role === "ADMIN"
        ? {} // Admin can see all leads
        : { createdBy: session.user.id }; // Regular users see only their leads

    const leads = await Lead.find(query)
      .populate("assignedTo", "firstName lastName email role status")
      .sort({ createdAt: -1 })
      .lean<PopulatedLead[]>();

    console.log(`Found ${leads.length} leads`);

    const transformedLeads = leads.map((lead) => ({
      _id: lead._id.toString(),
      id: lead._id.toString(),
      firstName: lead.firstName,
      lastName: lead.lastName,
      name: `${lead.firstName} ${lead.lastName}`,
      email: lead.email,
      phone: lead.phone,
      country: lead.country,
      source: lead.source,
      status: lead.status,
      comments: lead.comments,
      assignedTo: lead.assignedTo
        ? {
            id: lead.assignedTo._id.toString(),
            firstName: lead.assignedTo.firstName,
            lastName: lead.assignedTo.lastName,
            email: lead.assignedTo.email,
            role: lead.assignedTo.role,
            status: lead.assignedTo.status,
          }
        : null,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    }));

    console.log("Successfully transformed leads data");

    return NextResponse.json(transformedLeads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching leads",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
