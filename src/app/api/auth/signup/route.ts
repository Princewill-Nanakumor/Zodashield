// src/app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { connectMongoDB } from "@/libs/dbConfig";
import User from "@/models/User";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  country: string;
  role: "ADMIN" | "SUBADMIN" | "AGENT";
  status: "ACTIVE" | "INACTIVE";
  permissions: string[];
  emailVerified: boolean;
  verificationToken: string;
  verificationTokenExpiry: Date;
  createdBy?: string | null;
  adminId?: string | null;
}

export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, password, phoneNumber, country } =
      await req.json();

    console.log("🔍 Signup request received:", {
      firstName,
      lastName,
      email,
      country,
    });

    // Input validation
    if (!firstName || !lastName || !email || !password || !country) {
      console.log("❌ Missing required fields");
      return NextResponse.json(
        { message: "All required fields must be provided" },
        { status: 400 }
      );
    }

    await connectMongoDB();
    console.log("✅ Database connected");

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("❌ User already exists:", email);
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Check if this is the first user (system owner)
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;

    console.log("📊 User count in database:", userCount);
    console.log("👑 Is first user:", isFirstUser);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log("🔐 Password hashed successfully");

    // Create user with ADMIN role for ALL users who sign up
    const userData: UserData = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phoneNumber: phoneNumber || "",
      country,
      role: "ADMIN", // ALL users become ADMIN
      status: "ACTIVE",
      permissions: [
        "ASSIGN_LEADS",
        "DELETE_COMMENTS",
        "VIEW_PHONE_NUMBERS",
        "VIEW_EMAILS",
        "MANAGE_USERS",
        "EDIT_LEAD_STATUS",
      ],
      emailVerified: false,
      verificationToken: crypto.randomBytes(32).toString("hex"),
      verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };

    // Set adminId based on whether it's the first user
    if (isFirstUser) {
      console.log("👑 First user - no adminId set");
    } else {
      userData.createdBy = null; // This will be set by admin when creating users
      console.log("📝 Setting createdBy to null for subsequent users");
    }

    const user = await User.create(userData);
    console.log("✅ User created successfully:", {
      id: user._id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    });

    // Send verification email
    try {
      await resend.emails.send({
        from: "ZodaShield <noreply@zodashield.com>",
        to: [email],
        subject: "Verify your email address",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">Welcome to ZodaShield!</h2>
            <p>Hi ${firstName},</p>
            <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
            <a href="${process.env.NEXTAUTH_URL}/verify-email?token=${userData.verificationToken}" 
               style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              Verify Email
            </a>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create this account, please ignore this email.</p>
          </div>
        `,
      });
      console.log(" Verification email sent successfully");
    } catch (emailError) {
      console.error("❌ Failed to send verification email:", emailError);
      // Don't fail the signup if email fails
    }

    // Remove password from response - use eslint-disable for this line
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user.toObject();

    console.log("🎉 Signup completed successfully. Returning response:", {
      isFirstUser,
      userRole: user.role,
      userPermissions: user.permissions,
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: userWithoutPassword,
        isFirstUser,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("💥 Error creating user:", error);

    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
