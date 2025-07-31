// src/app/api/subscription/status/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import { authOptions } from "@/libs/auth";
import mongoose from "mongoose";

// Define the User schema directly in the API route to ensure it has all fields
const userSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: String,
    password: String,
    phoneNumber: String,
    country: String,
    role: {
      type: String,
      enum: ["ADMIN", "AGENT"],
      default: "AGENT",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    permissions: [String],
    adminId: mongoose.Schema.Types.ObjectId,
    createdBy: mongoose.Schema.Types.ObjectId,
    lastLogin: Date,

    // Subscription and billing fields
    balance: {
      type: Number,
      default: 0,
    },
    isOnTrial: {
      type: Boolean,
      default: true,
    },
    trialEndsAt: {
      type: Date,
      default: function () {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 3);
        return trialEnd;
      },
    },
    currentPlan: {
      type: String,
      enum: ["starter", "professional", "enterprise"],
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive", "trial", "expired"],
      default: "trial",
    },
    subscriptionStartDate: Date,
    subscriptionEndDate: Date,
    maxLeads: {
      type: Number,
      default: 50,
    },
    maxUsers: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Clear any existing model and create a fresh one
if (mongoose.models.User) {
  delete mongoose.models.User;
}

const User = mongoose.model("User", userSchema);

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    // Find the user
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("API - Found user:", {
      email: user.email,
      trialEndsAt: user.trialEndsAt,
      subscriptionStatus: user.subscriptionStatus,
      isOnTrial: user.isOnTrial,
      subscriptionEndDate: user.subscriptionEndDate,
      subscriptionStartDate: user.subscriptionStartDate,
    });

    // Calculate trial status
    const now = new Date();
    const trialEndDate = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
    const isOnTrial = user.isOnTrial && trialEndDate && now < trialEndDate;
    const trialExpired = trialEndDate && now > trialEndDate;

    // Determine subscription status
    let subscriptionStatus: "active" | "inactive" | "trial" | "expired";

    if (user.subscriptionStatus === "active") {
      subscriptionStatus = "active";
    } else if (isOnTrial) {
      subscriptionStatus = "trial";
    } else if (trialExpired) {
      subscriptionStatus = "expired";
    } else {
      subscriptionStatus = "inactive";
    }

    // Get user's balance
    const balance = user.balance || 0;

    const response = {
      isOnTrial: isOnTrial,
      trialEndsAt: user.trialEndsAt,
      currentPlan: user.currentPlan,
      subscriptionStatus,
      balance,
      subscriptionEndDate: user.subscriptionEndDate, // Added this field
      subscriptionStartDate: user.subscriptionStartDate, // Added this field
    };

    console.log("API - Returning:", response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
