// src/app/api/notifications/all/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { connectMongoDB } from "@/libs/dbConfig";
import mongoose from "mongoose";

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
        // NO read filter - show all notifications
      };
    } else if (userRole === "ADMIN") {
      query = {
        role: "ADMIN",
        userId: userId,
        // NO read filter - show all notifications
      };
    } else {
      query = {
        role: { $in: ["AGENT", "USER"] },
        // NO read filter - show all notifications
      };
    }

    const notifications = await mongoose.connection.db
      .collection("notifications")
      .find(query)
      .sort({ createdAt: -1 })
      .limit(100) // Increased limit for all notifications
      .toArray();

    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Error fetching all notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
