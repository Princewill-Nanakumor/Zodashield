// src/app/api/leads/[id]/reminders/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { connectMongoDB } from "@/libs/dbConfig";
import Reminder from "@/models/Reminder";
import mongoose from "mongoose";

// GET - Fetch all reminders for a lead (user-specific)
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

    // Fetch reminders assigned to current user for this lead
    const reminders = await Reminder.find({
      leadId: id,
      assignedTo: session.user.id,
      status: { $ne: "DISMISSED" }, // Don't show dismissed reminders
    })
      .populate("assignedTo", "firstName lastName")
      .populate("createdBy", "firstName lastName")
      .sort({ reminderDate: 1, reminderTime: 1 });

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
    const { id } = await params;
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

    const reminder = await Reminder.create({
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
    });

    const populatedReminder = await Reminder.findById(reminder._id)
      .populate("assignedTo", "firstName lastName")
      .populate("createdBy", "firstName lastName");

    return NextResponse.json(populatedReminder, { status: 201 });
  } catch (error) {
    console.error("Error creating reminder:", error);
    return NextResponse.json(
      { error: "Failed to create reminder" },
      { status: 500 }
    );
  }
}
