import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { connectMongoDB } from "@/libs/dbConfig";
import Reminder from "@/models/Reminder";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const now = new Date();
    const currentDateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

    const adminId =
      session.user.role === "ADMIN" ? session.user.id : session.user.adminId;

    if (!adminId) {
      return NextResponse.json(
        { error: "Admin ID not found for session user" },
        { status: 400 }
      );
    }

    const allReminders = await Reminder.find({
      adminId: new mongoose.Types.ObjectId(adminId),
      assignedTo: new mongoose.Types.ObjectId(session.user.id),
      status: { $in: ["PENDING", "SNOOZED"] }, // Only consider pending or snoozed
    })
      .populate("leadId", "firstName lastName email")
      .populate("assignedTo", "firstName lastName")
      .populate("createdBy", "firstName lastName");

    // Filter reminders that are actually due (more accurate client-side filtering)
    const dueReminders = allReminders
      .filter((reminder) => {
        if (reminder.status === "SNOOZED") {
          const isDue = reminder.snoozedUntil && reminder.snoozedUntil <= now;
          return isDue;
        }

        if (reminder.status === "PENDING") {
          // Check if reminder date is today or in the past
          const reminderDate = new Date(reminder.reminderDate);
          const reminderDateStr = reminderDate.toISOString().split("T")[0]; // Get YYYY-MM-DD

          // Check if it's a future date (not today or past)
          if (reminderDateStr > currentDateStr) {
            return false; // Future date
          }

          // If it's today, check if time has passed
          if (reminderDateStr === currentDateStr) {
            // Same day - check time with a small buffer (30 seconds early)
            const [reminderHour, reminderMinute] = reminder.reminderTime
              .split(":")
              .map(Number);
            const reminderMinutes = reminderHour * 60 + reminderMinute;
            const currentMinutes = now.getHours() * 60 + now.getMinutes();
            const currentSeconds = now.getSeconds();

            // Allow reminder to trigger 30 seconds before the exact time
            const bufferMinutes = currentSeconds >= 30 ? 0.5 : 0;
            const adjustedCurrentMinutes = currentMinutes + bufferMinutes;

            const isDue = reminderMinutes <= adjustedCurrentMinutes;
            return isDue;
          }

          // Past date - definitely due
          return true;
        }

        return false;
      })
      .slice(0, 10); // Limit to 10 results

    return NextResponse.json(dueReminders);
  } catch (error) {
    console.error("Error checking due reminders:", error);
    return NextResponse.json(
      { error: "Failed to check due reminders" },
      { status: 500 }
    );
  }
}
