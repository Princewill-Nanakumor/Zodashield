// app/api/leads/assign/route.ts (Simplified - No Transactions)
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { connectMongoDB } from "@/libs/dbConfig";
import Lead from "@/models/Lead";
import Activity from "@/models/Activity";
import { authOptions } from "@/libs/auth";

interface AssignLeadsRequest {
  leadIds: string[];
  userId: string;
  leadsData?: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    source: string;
    status: string;
    country: string;
    comments?: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { leadIds, userId, leadsData }: AssignLeadsRequest =
      await request.json();

    if (!leadIds?.length || !userId) {
      return NextResponse.json(
        { message: "Invalid request data" },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const leadObjectIds = leadIds.map((id) => new mongoose.Types.ObjectId(id));

    // Get leads before update with populated assignedTo
    const beforeLeads = await Lead.find({
      _id: { $in: leadObjectIds },
    }).populate("assignedTo", "firstName lastName");

    // Get user details
    const User = mongoose.model("User");
    const [assignedToUser, assignedByUser] = await Promise.all([
      User.findById(userId).select("firstName lastName"),
      User.findById(session.user.id).select("firstName lastName"),
    ]);

    if (!assignedToUser) {
      return NextResponse.json(
        { message: "Target user not found" },
        { status: 404 }
      );
    }

    // Update leads and create activities
    const updatePromises = beforeLeads.map(async (lead) => {
      const leadData = leadsData?.find((l) => l._id === lead._id.toString());
      const oldAssignedTo = lead.assignedTo;
      const isReassignment = !!oldAssignedTo;

      // Update lead
      const updateData = leadData
        ? {
            ...leadData,
            assignedTo: userObjectId,
            updatedAt: new Date(),
          }
        : {
            assignedTo: userObjectId,
            updatedAt: new Date(),
          };

      const updatedLead = await Lead.findByIdAndUpdate(lead._id, updateData, {
        new: true,
      });

      // Create activity
      const activity = new Activity({
        type: "ASSIGNMENT",
        userId: new mongoose.Types.ObjectId(session.user.id),
        details: isReassignment
          ? `Lead reassigned from ${oldAssignedTo ? `${oldAssignedTo.firstName} ${oldAssignedTo.lastName}` : "Unknown"} to ${assignedToUser.firstName} ${assignedToUser.lastName}`
          : `Lead assigned to ${assignedToUser.firstName} ${assignedToUser.lastName}`,
        leadId: lead._id,
        timestamp: new Date(),
        metadata: {
          assignedTo: {
            id: assignedToUser._id.toString(),
            firstName: assignedToUser.firstName,
            lastName: assignedToUser.lastName,
          },
          assignedFrom: oldAssignedTo
            ? {
                id: oldAssignedTo._id.toString(),
                firstName: oldAssignedTo.firstName,
                lastName: oldAssignedTo.lastName,
              }
            : null,
          assignedBy: {
            id: assignedByUser._id.toString(),
            firstName: assignedByUser.firstName,
            lastName: assignedByUser.lastName,
          },
        },
      });

      await activity.save();
      return updatedLead;
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${leadIds.length} leads`,
      modifiedCount: leadIds.length,
    });
  } catch (error) {
    console.error("Error in assign endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Error assigning leads",
      },
      { status: 500 }
    );
  }
}
