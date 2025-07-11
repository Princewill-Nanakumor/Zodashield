import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import User from "@/models/User";
import { authOptions } from "@/libs/auth";
import bcrypt from "bcryptjs";

function extractUserIdFromUrl(urlString: string): string {
  const url = new URL(urlString);
  const parts = url.pathname.split("/");
  // Assumes route: /api/users/[userId]/reset-password
  // e.g. /api/users/123/reset-password -> parts = ["", "api", "users", "123", "reset-password"]
  return parts[parts.length - 2];
}

export async function POST(request: Request) {
  try {
    const userId = extractUserIdFromUrl(request.url);

    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { password } = await request.json();

    if (!password || password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const hashedPassword = await bcrypt.hash(password, 10);

    // Build query with multi-tenancy filter
    const query: { _id: string; createdBy?: string } = {
      _id: userId,
    };

    // Admin can only reset passwords for users they created
    query.createdBy = session.user.id;

    const user = await User.findOneAndUpdate(
      query,
      {
        password: hashedPassword,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { message: "User not found or not authorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Password reset successful",
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { message: "Error resetting password" },
      { status: 500 }
    );
  }
}
