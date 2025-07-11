// src/app/api/leads/count/route.ts
import { NextResponse } from "next/server";
import { connectMongoDB } from "@/libs/dbConfig";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    // Check if database connection is available
    if (!mongoose.connection.db) {
      throw new Error("Database connection not available");
    }

    // Build query based on user role for multi-tenancy
    const query: {
      adminId?: mongoose.Types.ObjectId;
      assignedTo?: mongoose.Types.ObjectId;
    } = {};

    if (session.user.role === "ADMIN") {
      // Admin counts only leads they created
      query.adminId = new mongoose.Types.ObjectId(session.user.id);
    } else if (session.user.role === "AGENT") {
      // Agent counts only leads assigned to them from their admin
      query.assignedTo = new mongoose.Types.ObjectId(session.user.id);
      if (session.user.adminId) {
        query.adminId = new mongoose.Types.ObjectId(session.user.adminId);
      }
    }

    const count = await mongoose.connection.db
      .collection("leads")
      .countDocuments(query);

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error in leads/count route:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads count" },
      { status: 500 }
    );
  }
}
