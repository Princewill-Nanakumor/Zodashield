// /Users/safeconnection/Downloads/drivecrm/src/app/api/users/me/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { connectMongoDB } from "@/libs/dbConfig";
import mongoose from "mongoose";

// Define proper types
interface UserQuery {
  email: string;
  adminId?: string;
  role?: "ADMIN";
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Database connection not available");
    }

    // Build query based on user role
    const query: UserQuery = { email: session.user.email };

    // For multi-tenancy: AGENT users need to include adminId in query
    if (session.user.role === "AGENT" && session.user.adminId) {
      query.adminId = session.user.adminId;
    } else if (session.user.role === "ADMIN") {
      // ADMIN users don't have adminId, so we don't include it
      query.role = "ADMIN";
    }

    const user = await db.collection("users").findOne(query);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // Transform to match your frontend interface
    const userProfile = {
      id: user._id.toString(),
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email,
      phoneNumber: user.phoneNumber || "",
      country: user.country || "",
      role: user.role || "AGENT",
      status: user.status || "ACTIVE",
      permissions: user.permissions || [],
      createdBy: user.createdBy?.toString() || "",
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      lastLogin: user.lastLogin?.toISOString(),
    };

    return NextResponse.json(userProfile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
