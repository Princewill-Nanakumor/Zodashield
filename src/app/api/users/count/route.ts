import { NextResponse } from "next/server";
import { connectMongoDB } from "@/libs/dbConfig";
import User from "@/models/User"; // Make sure this is your user model

export async function GET() {
  try {
    await connectMongoDB();
    const count = await User.countDocuments();
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error in users/count route:", error);
    return NextResponse.json(
      { error: "Failed to fetch user count" },
      { status: 500 }
    );
  }
}
