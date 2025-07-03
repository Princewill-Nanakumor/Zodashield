// src/app/api/leads/count/route.ts
import { NextResponse } from "next/server";
import { connectMongoDB } from "@/libs/dbConfig";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectMongoDB();

    // Check if database connection is available
    if (!mongoose.connection.db) {
      throw new Error("Database connection not available");
    }

    const count = await mongoose.connection.db
      .collection("leads")
      .countDocuments();

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error in leads/count route:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads count" },
      { status: 500 }
    );
  }
}
