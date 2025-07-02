// src/app/api/auth/signin/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectMongoDB } from "@/libs/dbConfig";
import User from "@/models/User";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    await connectMongoDB();

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 400 }
      );
    }

    // Check if user is active
    if (user.status === "INACTIVE") {
      return NextResponse.json(
        { message: "Account is inactive. Please contact administrator." },
        { status: 403 }
      );
    }

    // Check if email is verified (optional, but matches signup flow)
    if (!user.emailVerified) {
      return NextResponse.json(
        { message: "Please verify your email before signing in." },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      permissions: user.permissions,
    });
  } catch (error: unknown) {
    console.error("Sign in error:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { message: `Error during sign in: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "An unexpected error occurred during sign in" },
      { status: 500 }
    );
  }
}
