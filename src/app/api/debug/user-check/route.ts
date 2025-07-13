import { NextResponse } from "next/server";
import { connectMongoDB } from "@/libs/dbConfig";
import mongoose from "mongoose";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await connectMongoDB();

    if (!mongoose.connection.db) {
      throw new Error("Database connection not available");
    }

    const db = mongoose.connection.db;

    // Try to find the user with exact email
    const user = await db.collection("users").findOne({ email: email });

    if (!user) {
      // Try with lowercase
      const userLower = await db
        .collection("users")
        .findOne({ email: email.toLowerCase() });

      if (!userLower) {
        // Try with uppercase
        const userUpper = await db
          .collection("users")
          .findOne({ email: email.toUpperCase() });

        if (!userUpper) {
          return NextResponse.json({
            found: false,
            message: "User not found with any case variation",
            searchedEmail: email,
          });
        } else {
          return NextResponse.json({
            found: true,
            user: {
              _id: userUpper._id.toString(),
              firstName: userUpper.firstName,
              lastName: userUpper.lastName,
              email: userUpper.email,
              role: userUpper.role,
              status: userUpper.status,
              hasPassword: !!userUpper.password,
              adminId: userUpper.adminId?.toString(),
              createdBy: userUpper.createdBy?.toString(),
            },
            message: "Found with uppercase email",
          });
        }
      } else {
        return NextResponse.json({
          found: true,
          user: {
            _id: userLower._id.toString(),
            firstName: userLower.firstName,
            lastName: userLower.lastName,
            email: userLower.email,
            role: userLower.role,
            status: userLower.status,
            hasPassword: !!userLower.password,
            adminId: userLower.adminId?.toString(),
            createdBy: userLower.createdBy?.toString(),
          },
          message: "Found with lowercase email",
        });
      }
    } else {
      return NextResponse.json({
        found: true,
        user: {
          _id: user._id.toString(),
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          status: user.status,
          hasPassword: !!user.password,
          adminId: user.adminId?.toString(),
          createdBy: user.createdBy?.toString(),
        },
        message: "Found with exact email",
      });
    }
  } catch (error) {
    console.error("Error checking user:", error);
    return NextResponse.json(
      {
        error: "Failed to check user",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
