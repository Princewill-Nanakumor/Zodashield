// /Users/safeconnection/Downloads/drivecrm-main/src/app/api/users/[userId]/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import { authOptions } from "@/libs/auth";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();
    const { userId } = await params;

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection not available");

    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Return only necessary user fields for lead assignment
    const userData = {
      _id: user._id.toString(),
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    return NextResponse.json(userData);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const { action, ...data } = await request.json();

    await connectMongoDB();

    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection not available");

    switch (action) {
      case "update-status": {
        const result = await db.collection("users").findOneAndUpdate(
          {
            _id: new ObjectId(userId),
            createdBy: new ObjectId(session.user.id),
          },
          { $set: { status: data.status, updatedAt: new Date() } },
          { returnDocument: "after" }
        );

        // Check if result is null or if result.value is null
        if (!result || !result.value) {
          return NextResponse.json(
            { message: "User not found" },
            { status: 404 }
          );
        }

        return NextResponse.json({
          message: "Status updated successfully",
          user: result.value,
        });
      }

      default:
        return NextResponse.json(
          { message: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Error updating user" },
      { status: 500 }
    );
  }
}
