// src/app/api/leads/[id]/reminders/[reminderId]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { connectMongoDB } from "@/libs/dbConfig";
import Reminder from "@/models/Reminder";

// PUT - Update reminder (complete, snooze, edit)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; reminderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();
    const { reminderId } = await params;
    const body = await request.json();

    const reminder = await Reminder.findOne({
      _id: reminderId,
      assignedTo: session.user.id,
    });

    if (!reminder) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    // Handle different update types
    if (body.status === "COMPLETED") {
      reminder.status = "COMPLETED";
      reminder.completedAt = new Date();
    } else if (body.status === "SNOOZED" && body.snoozedUntil) {
      reminder.status = "SNOOZED";
      reminder.snoozedUntil = new Date(body.snoozedUntil);
      reminder.notificationSent = false;
    } else if (body.status === "DISMISSED") {
      reminder.status = "DISMISSED";
    } else {
      // Regular update
      if (body.title) reminder.title = body.title;
      if (body.description !== undefined)
        reminder.description = body.description;
      if (body.reminderDate)
        reminder.reminderDate = new Date(body.reminderDate);
      if (body.reminderTime) reminder.reminderTime = body.reminderTime;
      if (body.type) reminder.type = body.type;
      if (body.soundEnabled !== undefined)
        reminder.soundEnabled = body.soundEnabled;
      reminder.notificationSent = false; // Reset notification if time changed
    }

    await reminder.save();

    const updatedReminder = await Reminder.findById(reminder._id)
      .populate("assignedTo", "firstName lastName")
      .populate("createdBy", "firstName lastName");

    return NextResponse.json(updatedReminder);
  } catch (error) {
    console.error("Error updating reminder:", error);
    return NextResponse.json(
      { error: "Failed to update reminder" },
      { status: 500 }
    );
  }
}

// DELETE - Delete reminder
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; reminderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();
    const { reminderId } = await params;

    const reminder = await Reminder.findOneAndDelete({
      _id: reminderId,
      assignedTo: session.user.id,
    });

    if (!reminder) {
      return NextResponse.json(
        { error: "Reminder not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Reminder deleted successfully" });
  } catch (error) {
    console.error("Error deleting reminder:", error);
    return NextResponse.json(
      { error: "Failed to delete reminder" },
      { status: 500 }
    );
  }
}
