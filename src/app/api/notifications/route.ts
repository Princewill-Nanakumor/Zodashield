// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { connectMongoDB } from "@/libs/dbConfig";
import mongoose from "mongoose";
import { sendPaymentConfirmationEmail } from "@/lib/emailService";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();
    if (!mongoose.connection.db) {
      throw new Error("Database connection not established");
    }

    const userRole = session.user.role;
    const userEmail = session.user.email;
    const userId = session.user.id;

    const superAdminEmails =
      process.env.SUPER_ADMIN_EMAILS?.split(",").map((e) => e.trim()) || [];
    const isSuperAdmin = userEmail && superAdminEmails.includes(userEmail);

    let query: Record<string, unknown> = {};

    if (isSuperAdmin) {
      query = {
        $or: [{ role: "SUPER_ADMIN" }, { role: "ADMIN", userId: userId }],
        read: false, // Only return unread notifications
      };
    } else if (userRole === "ADMIN") {
      query = {
        role: "ADMIN",
        userId: userId,
        read: false, // Only return unread notifications
      };
    } else {
      query = {
        role: { $in: ["AGENT", "USER"] },
        read: false, // Only return unread notifications
      };
    }

    const notifications = await mongoose.connection.db
      .collection("notifications")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Hard gate: only accept notifications that come from the explicit confirm click
    const source = request.headers.get("x-source");
    if (source !== "USER_CONFIRMATION") {
      return NextResponse.json(
        { error: "Invalid notification source" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      type,
      message,
      role,
      link,
      paymentId,
      amount,
      currency,
      userId,
      deduplicationKey,
    } = body;

    if (!paymentId || !type || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectMongoDB();
    if (!mongoose.connection.db) {
      throw new Error("Database connection not established");
    }

    // Atomic dedup using a stable key per payment confirmation
    const dedupKey = deduplicationKey || `payment_confirmation_${paymentId}`;

    const notificationsCol = mongoose.connection.db.collection("notifications");
    const now = new Date();

    const doc = {
      type,
      message,
      role,
      link,
      paymentId,
      amount,
      currency,
      userId,
      createdAt: now.toISOString(),
      read: false,
      timestamp: now.getTime(),
      deduplicationKey: dedupKey,
    };

    // Upsert to avoid race-condition duplicates
    const upsertResult = await notificationsCol.updateOne(
      { deduplicationKey: dedupKey },
      { $setOnInsert: doc },
      { upsert: true }
    );

    // Only send email if this is a new notification (not a duplicate)
    if (upsertResult.upsertedCount > 0) {
      // Get payment details for email
      const paymentsCol = mongoose.connection.db.collection("payments");
      const payment = await paymentsCol.findOne({
        _id: new mongoose.Types.ObjectId(paymentId),
      });

      if (payment) {
        // Send email notification
        const emailResult = await sendPaymentConfirmationEmail({
          paymentId: paymentId,
          amount: amount,
          currency: currency,
          network: payment.network || "Unknown",
          userFirstName: session.user.firstName || "Unknown",
          userLastName: session.user.lastName || "User",
          userEmail: session.user.email || "unknown@email.com",
          transactionId: payment.transactionId,
        });

        console.log("Email send result:", emailResult);
      }
    } else {
      console.log("Notification already exists, skipping email send");
    }

    // Return the single canonical document
    const notification = await notificationsCol.findOne({
      deduplicationKey: dedupKey,
    });

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
