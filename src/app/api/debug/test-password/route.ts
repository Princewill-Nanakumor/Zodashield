import { NextResponse } from "next/server";
import { connectMongoDB } from "@/libs/dbConfig";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    await connectMongoDB();

    if (!mongoose.connection.db) {
      throw new Error("Database connection not available");
    }

    const db = mongoose.connection.db;

    // Try to find the user with exact email first
    let user = await db.collection("users").findOne({ email: email });

    // If not found, try with lowercase
    if (!user) {
      user = await db
        .collection("users")
        .findOne({ email: email.toLowerCase() });
    }

    // If still not found, try with uppercase
    if (!user) {
      user = await db
        .collection("users")
        .findOne({ email: email.toUpperCase() });
    }

    if (!user) {
      return NextResponse.json({
        found: false,
        message: "User not found with any case variation",
        searchedEmail: email,
      });
    }

    // Check if user has password
    if (!user.password) {
      return NextResponse.json({
        found: true,
        hasPassword: false,
        message: "User exists but has no password",
      });
    }

    // Try to verify password
    try {
      const passwordMatch = await bcrypt.compare(password, user.password);

      return NextResponse.json({
        found: true,
        hasPassword: true,
        passwordMatch: passwordMatch,
        user: {
          _id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          status: user.status,
        },
        message: passwordMatch
          ? "Password is correct"
          : "Password is incorrect",
      });
    } catch (bcryptError) {
      return NextResponse.json({
        found: true,
        hasPassword: true,
        passwordMatch: false,
        message: "Error verifying password",
        error:
          bcryptError instanceof Error ? bcryptError.message : "Unknown error",
      });
    }
  } catch (error) {
    console.error("Error testing password:", error);
    return NextResponse.json(
      {
        error: "Failed to test password",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
