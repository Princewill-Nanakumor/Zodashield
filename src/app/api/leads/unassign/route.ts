// app/api/leads/unassign/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { connectMongoDB } from "@/libs/dbConfig";
import Lead from "@/models/Lead";
import Activity from "@/models/Activity";
import { authOptions } from "@/libs/auth";

interface UnassignLeadsRequest {
  leadIds: string[];
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { leadIds }: UnassignLeadsRequest = await request.json();

    if (!leadIds?.length) {
      return NextResponse.json(
        { message: "Invalid request data" },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const leadObjectIds = leadIds.map((id) => new mongoose.Types.ObjectId(id));

    // Get leads before update with populated assignedTo
    const beforeLeads = await Lead.find({
      _id: { $in: leadObjectIds },
      assignedTo: { $exists: true, $ne: null },
    }).populate("assignedTo", "firstName lastName");

    // Get user doing the unassignment
    const User = mongoose.model("User");
    const assignedByUser = await User.findById(session.user.id).select(
      "firstName lastName"
    );

    // Update leads and create activities
    const updatePromises = beforeLeads.map(async (lead) => {
      const oldAssignedTo = lead.assignedTo;

      // Update lead
      const updatedLead = await Lead.findByIdAndUpdate(
        lead._id,
        {
          assignedTo: null,
          updatedAt: new Date(),
        },
        { new: true }
      );

      // Create activity using your existing Activity model
      const activity = new Activity({
        type: "ASSIGNMENT", // Using ASSIGNMENT type for unassignment too
        userId: new mongoose.Types.ObjectId(session.user.id),
        details: `Lead unassigned from ${oldAssignedTo.firstName} ${oldAssignedTo.lastName}`,
        leadId: lead._id,
        timestamp: new Date(),
        metadata: {
          assignedTo: null,
          assignedFrom: {
            id: oldAssignedTo._id.toString(),
            firstName: oldAssignedTo.firstName,
            lastName: oldAssignedTo.lastName,
          },
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

    const results = await Promise.all(updatePromises);
    const updatedLeads = results.filter(Boolean);

    console.log("Unassignment completed for leads:", updatedLeads.length);

    return NextResponse.json({
      success: true,
      message: `Successfully unassigned ${updatedLeads.length} leads`,
      unassignedCount: updatedLeads.length,
    });
  } catch (error) {
    console.error("Error in unassign endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Error unassigning leads",
      },
      { status: 500 }
    );
  }
}
