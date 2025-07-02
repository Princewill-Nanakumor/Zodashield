// src/app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectMongoDB } from "@/libs/dbConfig";
import User from "@/models/User";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, password, phoneNumber, country } =
      await req.json();

    // Input validation
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !phoneNumber ||
      !country
    ) {
      return NextResponse.json(
        { message: "All fields are required" },
        { status: 400 }
      );
    }

    // Input sanitization
    const sanitizedData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phoneNumber: phoneNumber.trim(),
      country: country.trim(),
    };

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedData.email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // Check if user exists
    const existingUser = await User.findOne({ email: sanitizedData.email });
    if (existingUser) {
      return NextResponse.json(
        {
          message:
            "An account with this email already exists. Please sign in instead.",
        },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if this is the first user
    const isFirstUser = (await User.countDocuments({})) === 0;

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const newUser = await User.create({
      ...sanitizedData,
      password: hashedPassword,
      role: isFirstUser ? "ADMIN" : "AGENT",
      permissions: isFirstUser
        ? [
            "ASSIGN_LEADS",
            "DELETE_COMMENTS",
            "VIEW_PHONE_NUMBERS",
            "VIEW_EMAILS",
            "MANAGE_USERS",
            "EDIT_LEAD_STATUS",
          ]
        : [],
      emailVerified: false,
      verificationToken,
      verificationExpires,
      status: "ACTIVE",
    });

    // Send verification email
    try {
      await resend.emails.send({
        from: "CRM <onboarding@resend.dev>",
        to: sanitizedData.email,
        subject: "Verify your email address",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to DriveCRM!</h2>
            <p>Hi ${sanitizedData.firstName},</p>
            <p>Thank you for creating your account. Please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}" 
                 style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create this account, you can safely ignore this email.</p>
            <p>Best regards,<br>The DriveCRM Team</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    return NextResponse.json(
      {
        message:
          "Account created successfully! Please check your email to verify your account.",
        user: {
          id: newUser._id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating user:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        { message: "Unable to create account. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Unable to create account. Please try again." },
      { status: 500 }
    );
  }
}
