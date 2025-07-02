import { NextResponse } from "next/server";
import { connectMongoDB } from "@/libs/dbConfig";
import Lead from "@/models/Lead";

export async function GET() {
  try {
    await connectMongoDB();
    const count = await Lead.countDocuments();
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Error in leads/count route:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads count" },
      { status: 500 }
    );
  }
}
