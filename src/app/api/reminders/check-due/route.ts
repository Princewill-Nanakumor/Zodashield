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

    // Create date strings for comparison
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    const currentDay = String(now.getDate()).padStart(2, "0");
    const currentDateStr = `${currentYear}-${currentMonth}-${currentDay}`;

    const currentHour = String(now.getHours()).padStart(2, "0");
    const currentMinute = String(now.getMinutes()).padStart(2, "0");
    const currentTimeStr = `${currentHour}:${currentMinute}`;

    console.log("Checking reminders:", { currentDateStr, currentTimeStr });

    // Find reminders that are due
    const dueReminders = await Reminder.find({
      assignedTo: session.user.id,
      status: { $in: ["PENDING", "SNOOZED"] },
      $or: [
        {
          // Regular pending reminders - check if date is today or past, and time has passed
          status: "PENDING",
          reminderDate: { $lte: new Date(currentDateStr + "T23:59:59") },
          reminderTime: { $lte: currentTimeStr },
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

    console.log("Found due reminders:", dueReminders.length);

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
