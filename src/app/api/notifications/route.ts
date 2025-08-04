// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { connectMongoDB } from "@/libs/dbConfig";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    // Check if connection is established
    if (!mongoose.connection.db) {
      throw new Error("Database connection not established");
    }

    const userRole = session.user.role;
    const userEmail = session.user.email;
    const userId = session.user.id;

    // Get super admin emails from environment
    const superAdminEmails =
      process.env.SUPER_ADMIN_EMAILS?.split(",").map((e) => e.trim()) || [];
    const isSuperAdmin = userEmail && superAdminEmails.includes(userEmail);

    let query = {};

    if (isSuperAdmin) {
      // Super admins should see:
      // 1. SUPER_ADMIN notifications (payment pending approvals)
      // 2. ADMIN notifications that are for them specifically (payment approved/rejected)
      query = {
        $or: [{ role: "SUPER_ADMIN" }, { role: "ADMIN", userId: userId }],
      };
    } else if (userRole === "ADMIN") {
      // Regular admins should only see their own ADMIN notifications
      query = { role: "ADMIN", userId: userId };
    } else {
      query = { role: { $in: ["AGENT", "USER"] } };
    }

    // Use the native MongoDB driver through mongoose connection
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

    const body = await request.json();
    const { type, message, role, link, paymentId, amount, currency, userId } =
      body;

    await connectMongoDB();

    // Check if connection is established
    if (!mongoose.connection.db) {
      throw new Error("Database connection not established");
    }

    const notification = {
      _id: new ObjectId(),
      id: new ObjectId().toString(),
      type,
      message,
      role,
      link,
      paymentId,
      amount,
      currency,
      userId,
      createdAt: new Date().toISOString(),
      read: false,
    };

    await mongoose.connection.db
      .collection("notifications")
      .insertOne(notification);

    return NextResponse.json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
