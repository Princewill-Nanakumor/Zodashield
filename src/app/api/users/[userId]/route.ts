// src/app/api/users/[userId]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { withDatabase, executeDbOperation } from "@/libs/dbConfig";
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

    const { userId } = await params;

    if (!ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const userData = await withDatabase(async () => {
      const db = mongoose.connection.db;
      if (!db) throw new Error("Database connection not available");

      const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(userId) });

      if (!user) {
        throw new Error("User not found");
      }

      // Return only necessary user fields for lead assignment
      return {
        _id: user._id.toString(),
        id: user._id.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
      };
    });

    return NextResponse.json(userData);
  } catch (error) {
    console.error("Error fetching user:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch user";
    return NextResponse.json({ error: message }, { status: 500 });
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

    const result = await executeDbOperation(async () => {
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
            throw new Error("User not found");
          }

          return {
            message: "Status updated successfully",
            user: result.value,
          };
        }

        default:
          throw new Error("Invalid action");
      }
    }, "Error updating user");

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating user:", error);
    const message =
      error instanceof Error ? error.message : "Error updating user";
    return NextResponse.json({ message }, { status: 500 });
  }
}
