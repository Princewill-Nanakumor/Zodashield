// /Users/safeconnection/Downloads/drivecrm-main/src/app/api/users/[userId]/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import User from "@/models/User";
import { authOptions } from "@/libs/auth";

function extractUserIdFromUrl(urlString: string): string {
  const url = new URL(urlString);
  const parts = url.pathname.split("/");
  // Assumes route: /api/users/[userId]
  // e.g. /api/users/123 -> parts = ["", "api", "users", "123"]
  return parts[parts.length - 1];
}

export async function GET(request: Request) {
  try {
    const userId = extractUserIdFromUrl(request.url);

    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const user = await User.findOne({
      _id: userId,
      createdBy: session.user.id,
    }).select("-password");

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: unknown) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { message: "Error fetching user" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = extractUserIdFromUrl(request.url);

    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { action, ...data } = await request.json();

    await connectMongoDB();

    switch (action) {
      case "update-status": {
        await User.findOneAndUpdate(
          { _id: userId, createdBy: session.user.id },
          { status: data.status }
        );
        return NextResponse.json({
          message: "Status updated successfully",
        });
      }

      default:
        return NextResponse.json(
          { message: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Error updating user" },
      { status: 500 }
    );
  }
}
