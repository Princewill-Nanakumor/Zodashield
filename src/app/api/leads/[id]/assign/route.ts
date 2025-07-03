// app/api/leads/[id]/assign/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import { authOptions } from "@/libs/auth";
import mongoose from "mongoose";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await request.json();

  // Start database session for transaction
  const dbSession = await mongoose.startSession();

  try {
    await dbSession.withTransaction(async () => {
      await connectMongoDB();

      // Extract the id from the URL
      const url = new URL(request.url);
      const pathParts = url.pathname.split("/");
      const id = pathParts[pathParts.length - 1];

      // Get the Lead model from mongoose
      const Lead = mongoose.models.Lead;
      if (!Lead) {
        throw new Error("Lead model not found");
      }

      // Get the current lead with populated assignedTo
      const currentLead = await Lead.findById(id)
        .populate("assignedTo", "firstName lastName")
        .session(dbSession);

      if (!currentLead) {
        throw new Error("Lead not found");
      }

      const oldAssignedTo = currentLead.assignedTo;
      const isReassignment = !!oldAssignedTo;

      // Get user details for activity logging
      const User = mongoose.model("User");
      const [assignedToUser, assignedByUser] = await Promise.all([
        User.findById(userId).select("firstName lastName").session(dbSession),
        User.findById(session.user.id)
          .select("firstName lastName")
          .session(dbSession),
      ]);

      if (!assignedToUser) {
        throw new Error("Target user not found");
      }

      // Update the lead
      const lead = await Lead.findByIdAndUpdate(
        id,
        {
          assignedTo: userId,
          updatedAt: new Date(),
        },
        { new: true, session: dbSession }
      ).populate("assignedTo", "firstName lastName");

      if (!lead) {
        throw new Error("Failed to update lead");
      }

      // Create activity log using the Activity model
      const Activity = mongoose.models.Activity;
      if (Activity) {
        const activity = new Activity({
          type: "ASSIGNMENT",
          userId: new mongoose.Types.ObjectId(session.user.id),
          details: isReassignment
            ? `Lead reassigned from ${oldAssignedTo ? `${oldAssignedTo.firstName} ${oldAssignedTo.lastName}` : "Unknown"} to ${assignedToUser.firstName} ${assignedToUser.lastName}`
            : `Lead assigned to ${assignedToUser.firstName} ${assignedToUser.lastName}`,
          leadId: new mongoose.Types.ObjectId(id),
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

        await activity.save({ session: dbSession });
      }

      return NextResponse.json({
        message: isReassignment
          ? "Lead reassigned successfully"
          : "Lead assigned successfully",
        lead,
      });
    });
  } catch (error) {
    console.error("Error assigning lead:", error);
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Error assigning lead",
      },
      { status: 500 }
    );
  } finally {
    await dbSession.endSession();
  }
}
