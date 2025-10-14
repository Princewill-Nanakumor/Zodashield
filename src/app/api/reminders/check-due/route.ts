// src/app/api/reminders/check-due/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { connectMongoDB } from "@/libs/dbConfig";
import Reminder from "@/models/Reminder";

// GET - Check for due reminders for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const now = new Date();
    const currentDate = now.toISOString().split("T")[0]; // YYYY-MM-DD
    const currentTime = now.toTimeString().slice(0, 5); // HH:mm

    // Find reminders that are due
    const dueReminders = await Reminder.find({
      assignedTo: session.user.id,
      status: { $in: ["PENDING", "SNOOZED"] },
      $or: [
        {
          // Regular pending reminders
          status: "PENDING",
          reminderDate: { $lte: new Date(currentDate) },
          reminderTime: { $lte: currentTime },
          notificationSent: false,
        },
        {
          // Snoozed reminders
          status: "SNOOZED",
          snoozedUntil: { $lte: now },
        },
      ],
    })
      .populate("leadId", "firstName lastName email")
      .populate("assignedTo", "firstName lastName")
      .limit(10);

    // Mark as notification sent
    const reminderIds = dueReminders.map((r) => r._id);
    if (reminderIds.length > 0) {
      await Reminder.updateMany(
        { _id: { $in: reminderIds } },
        {
          $set: {
            notificationSent: true,
            status: "PENDING", // Reset snoozed reminders to pending
            snoozedUntil: null,
          },
        }
      );
    }

    return NextResponse.json(dueReminders);
  } catch (error) {
    console.error("Error checking due reminders:", error);
    return NextResponse.json(
      { error: "Failed to check reminders" },
      { status: 500 }
    );
  }
}
