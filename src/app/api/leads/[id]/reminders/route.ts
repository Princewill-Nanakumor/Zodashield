import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { connectMongoDB } from "@/libs/dbConfig";
import Reminder from "@/models/Reminder";
import Activity from "@/models/Activity";
import mongoose from "mongoose";

// GET - Fetch all reminders for a lead
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();
    const { id } = await params;

    // Get adminId to ensure we're working within the same organization
    const adminId =
      session.user.role === "ADMIN" ? session.user.id : session.user.adminId;

    const reminders = await Reminder.find({
      leadId: new mongoose.Types.ObjectId(id),
      adminId: new mongoose.Types.ObjectId(adminId),
    })
      .populate("assignedTo", "firstName lastName")
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 });

    return NextResponse.json(reminders);
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return NextResponse.json(
      { error: "Failed to fetch reminders" },
      { status: 500 }
    );
  }
}

// POST - Create a new reminder
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    // Some Next versions may not pass params reliably; derive from URL as fallback
    let id: string | undefined;
    try {
      const awaited = await params;
      id = awaited?.id;
    } catch {
      // Continue to URL extraction
    }

    if (!id) {
      const url = new URL(request.url);
      const parts = url.pathname.split("/");
      // /api/leads/:id/reminders → id is at index length - 2
      id = parts[parts.length - 2];
    }

    if (!id) {
      return NextResponse.json({ error: "Invalid lead id" }, { status: 400 });
    }

    const body = await request.json();

    const {
      title,
      description,
      reminderDate,
      reminderTime,
      type,
      soundEnabled,
    } = body;

    // Validation
    if (!title || !reminderDate || !reminderTime) {
      return NextResponse.json(
        { error: "Title, date, and time are required" },
        { status: 400 }
      );
    }

    // Get adminId based on user role
    const adminId =
      session.user.role === "ADMIN" ? session.user.id : session.user.adminId;

    const reminderData = {
      title,
      description,
      reminderDate: new Date(reminderDate),
      reminderTime,
      type: type || "TASK",
      status: "PENDING",
      leadId: new mongoose.Types.ObjectId(id),
      createdBy: new mongoose.Types.ObjectId(session.user.id),
      assignedTo: new mongoose.Types.ObjectId(session.user.id),
      adminId: new mongoose.Types.ObjectId(adminId),
      notificationSent: false,
      soundEnabled: soundEnabled !== undefined ? soundEnabled : true,
    };

    const reminder = await Reminder.create(reminderData);

    const populatedReminder = await Reminder.findById(reminder._id)
      .populate("assignedTo", "firstName lastName")
      .populate("createdBy", "firstName lastName");

    // Create activity log for reminder creation
    try {
      await Activity.create({
        type: "REMINDER_CREATED",
        userId: new mongoose.Types.ObjectId(session.user.id),
        details: `Created reminder: ${title}`,
        leadId: new mongoose.Types.ObjectId(id),
        adminId: new mongoose.Types.ObjectId(adminId),
        timestamp: new Date(),
        metadata: {
          reminderId: reminder._id.toString(),
          reminderTitle: title,
          reminderType: type || "TASK",
          reminderDate: reminderDate,
          reminderTime: reminderTime,
          reminderStatus: "PENDING",
          soundEnabled: soundEnabled !== undefined ? soundEnabled : true,
        },
      });
    } catch (activityError) {
      console.error("Error logging reminder creation activity:", activityError);
      // Don't fail the request if activity logging fails
    }

    return NextResponse.json(populatedReminder, { status: 201 });
  } catch (error) {
    console.error("Error creating reminder:", error);
    return NextResponse.json(
      { error: "Failed to create reminder" },
      { status: 500 }
    );
  }
}
