// src/app/api/verify-email/route.ts
import { NextResponse } from "next/server";
import { connectMongoDB } from "@/libs/dbConfig";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { message: "Verification token is required" },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // Find user with this verification token - USING CORRECT FIELD NAME
    const user = await User.findOne({
      verificationToken: token,
      verificationExpires: { $gt: new Date() }, // Changed to verificationExpires
    });

    if (!user) {
      // Check if token exists but is expired
      const expiredUser = await User.findOne({
        verificationToken: token,
      });

      if (expiredUser) {
        return NextResponse.json(
          { message: "Verification link has expired" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { message: "Invalid verification token" },
        { status: 400 }
      );
    }

    // Update user as verified - USING CORRECT FIELD NAME
    await User.findByIdAndUpdate(user._id, {
      emailVerified: true,
      verificationToken: undefined,
      verificationExpires: undefined, // Changed to verificationExpires
    });

    return NextResponse.json(
      { message: "Email verified successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error verifying email:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
