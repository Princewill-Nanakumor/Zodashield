// app/api/leads/[id]/route.ts
import { NextResponse, NextRequest } from "next/server";
import { connectMongoDB } from "@/libs/dbConfig";
import Lead from "@/models/Lead";
import Activity from "@/models/Activity";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import mongoose from "mongoose";

interface LeadUpdateObject {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  source?: string;
  status?: string;
  country?: string;
  comments?: string;
  assignedTo?: mongoose.Types.ObjectId | string;
  updatedAt: Date;
  [key: string]: unknown;
}

interface LeadChange {
  field: string;
  oldValue: string | mongoose.Types.ObjectId | null | undefined;
  newValue: string | mongoose.Types.ObjectId | null | undefined;
}

export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const leadId = pathParts[pathParts.length - 1];

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();
    const updates: Record<string, unknown> = await request.json();

    const existingLead = await Lead.findById(leadId);
    if (!existingLead) {
      return NextResponse.json({ message: "Lead not found" }, { status: 404 });
    }

    const updateObject: LeadUpdateObject = {
      updatedAt: new Date(),
    };

    const changes: LeadChange[] = [];

    Object.keys(updates).forEach((key) => {
      if (key === "updatedAt") return;

      const existingValue = existingLead[key as keyof typeof existingLead];
      const newValue = updates[key];

      if (newValue !== undefined && newValue !== existingValue) {
        updateObject[key] = newValue;
        changes.push({
          field: key,
          oldValue: existingValue as
            | string
            | mongoose.Types.ObjectId
            | null
            | undefined,
          newValue: newValue as
            | string
            | mongoose.Types.ObjectId
            | null
            | undefined,
        });
      }
    });

    if (updates.assignedTo !== undefined) {
      if (
        typeof updates.assignedTo === "object" &&
        updates.assignedTo &&
        "id" in updates.assignedTo
      ) {
        const newAssignedTo = (updates.assignedTo as { id: string }).id;
        if (newAssignedTo !== existingLead.assignedTo?.toString()) {
          updateObject.assignedTo = newAssignedTo;
          changes.push({
            field: "assignedTo",
            oldValue: existingLead.assignedTo,
            newValue: newAssignedTo,
          });
        }
      } else if (typeof updates.assignedTo === "string") {
        if (!mongoose.Types.ObjectId.isValid(updates.assignedTo)) {
          return NextResponse.json(
            { message: "Invalid assignedTo ID" },
            { status: 400 }
          );
        }
        if (updates.assignedTo !== existingLead.assignedTo?.toString()) {
          updateObject.assignedTo = updates.assignedTo;
          changes.push({
            field: "assignedTo",
            oldValue: existingLead.assignedTo,
            newValue: updates.assignedTo,
          });
        }
      }
    } else {
      updateObject.assignedTo = existingLead.assignedTo;
    }

    console.log("Updating lead with:", updateObject);

    const updatedLead = await Lead.findByIdAndUpdate(
      leadId,
      { $set: updateObject },
      { new: true }
    ).populate("assignedTo", "firstName lastName email");

    if (!updatedLead) {
      return NextResponse.json({ message: "Lead not found" }, { status: 404 });
    }

    // Create activity logs for changes (EXCLUDE status and assignment changes)
    for (const change of changes) {
      // Skip status changes (handled by dedicated status route)
      if (change.field === "status") {
        continue;
      }

      // Skip assignment changes (handled by dedicated assign/unassign routes)
      if (change.field === "assignedTo") {
        continue;
      }

      const oldValueStr = change.oldValue?.toString() || "None";
      const newValueStr = change.newValue?.toString() || "None";
      const description = `${change.field} updated from ${oldValueStr} to ${newValueStr}`;

      const activity = new Activity({
        type: "UPDATE",
        userId: new mongoose.Types.ObjectId(session.user.id),
        details: description,
        leadId: new mongoose.Types.ObjectId(leadId),
        timestamp: new Date(),
        metadata: {
          changes: [
            {
              field: change.field,
              oldValue: oldValueStr,
              newValue: newValueStr,
            },
          ],
        },
      });

      await activity.save();
    }

    console.log("Lead updated successfully:", {
      id: updatedLead._id,
      status: updatedLead.status,
      assignedTo: updatedLead.assignedTo,
      changesCount: changes.length,
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json(
      { message: "Error updating lead" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const leadId = pathParts[pathParts.length - 1];

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const lead = await Lead.findById(leadId).populate(
      "assignedTo",
      "firstName lastName email"
    );

    if (!lead) {
      return NextResponse.json({ message: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Error fetching lead:", error);
    return NextResponse.json(
      { message: "Error fetching lead" },
      { status: 500 }
    );
  }
}
