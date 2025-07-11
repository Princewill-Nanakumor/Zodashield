//src/app/api/users/count/route.ts
import { NextResponse } from "next/server";
import { connectMongoDB } from "@/libs/dbConfig";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    // Build query based on user role for multi-tenancy
    const query: { adminId?: string } = {};

    if (session.user.role === "ADMIN") {
      // Admin counts only users they created
      query.adminId = session.user.id;
    } else if (session.user.role === "AGENT" && session.user.adminId) {
      // Agent counts users from their admin
      query.adminId = session.user.adminId;
    }

    const count = await User.countDocuments(query);
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error in users/count route:", error);
    return NextResponse.json(
      { error: "Failed to fetch user count" },
      { status: 500 }
    );
  }
}
