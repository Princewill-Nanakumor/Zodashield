// src/app/api/leads/assign/[userId]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import { authOptions } from "@/libs/auth";
import mongoose from "mongoose";

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

    const leads = await mongoose.connection.db
      .collection("leads")
      .find({
        "assignedTo.id": session.user.id,
      })
      .sort({ createdAt: -1 })
      .toArray();

    const transformedLeads = leads.map((lead) => ({
      id: lead._id.toString(),
      firstName: lead.firstName,
      lastName: lead.lastName,
      name: `${lead.firstName} ${lead.lastName}`,
      email: lead.email,
      phone: lead.phone,
      country: lead.country,
      value: lead.value,
      source: lead.source,
      status: lead.status,
      comments: lead.comments,
      company: lead.company,
      assignedTo: lead.assignedTo,
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

    // Update all selected leads
    const updateResult = await mongoose.connection.db
      .collection("leads")
      .updateMany(
        { _id: { $in: leadIds.map((id) => new mongoose.Types.ObjectId(id)) } },
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
