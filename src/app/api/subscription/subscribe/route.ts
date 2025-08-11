// src/app/api/subscription/subscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import User from "@/models/User";
import { authOptions } from "@/libs/auth";
import mongoose from "mongoose";
import { rateLimitEnhanced } from "@/lib/rateLimit";

const SUBSCRIPTION_PLANS = {
  starter: {
    id: "starter",
    name: "Starter",
    price: 10.99,
    maxLeads: 10000,
    maxUsers: 2,
  },
  professional: {
    id: "professional",
    name: "Professional",
    price: 19.99,
    maxLeads: 30000,
    maxUsers: 5,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    price: 199.99,
    maxLeads: -1,
    maxUsers: -1,
  },
};

export async function POST(req: NextRequest) {
  // Rate limit: 5 requests per minute
  if (!rateLimitEnhanced(req, 5, 60000)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId, amount } = await req.json();

    // ✅ Validate input types
    if (!planId || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // ✅ Get plan details with validation
    const plan = SUBSCRIPTION_PLANS[planId as keyof typeof SUBSCRIPTION_PLANS];
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // ✅ Server-side validation: amount must match plan price
    if (amount !== plan.price) {
      return NextResponse.json(
        { error: "Invalid amount for selected plan" },
        { status: 400 }
      );
    }

    // ✅ Get user with fresh data from database
    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // ✅ Check if user already has an active subscription
    if (user.subscriptionStatus === "active") {
      return NextResponse.json(
        { error: "You already have an active subscription" },
        { status: 400 }
      );
    }

    // ✅ Server-side balance check with fallback
    const userBalance = user.balance || 0;
    if (userBalance < amount) {
      const shortfall = amount - userBalance;
      return NextResponse.json(
        {
          error: "Insufficient balance",
          shortfall: shortfall,
          required: amount,
          current: userBalance,
        },
        { status: 400 }
      );
    }

    // ✅ Security logging
    console.log(
      `Subscription attempt: User ${user.email} attempting to subscribe to ${planId} for $${amount}`
    );

    // ✅ Use database transaction for atomicity
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
      // ✅ Update user with transaction
      const updatedUser = await User.findByIdAndUpdate(
        session.user.id,
        {
          $set: {
            currentPlan: planId,
            subscriptionStatus: "active",
            isOnTrial: false,
            balance: userBalance - amount, // ✅ Server-calculated balance
            maxLeads: plan.maxLeads,
            maxUsers: plan.maxUsers,
            subscriptionStartDate: new Date(),
            subscriptionEndDate: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ), // 30 days
          },
        },
        { new: true, session: dbSession }
      );

      if (!updatedUser) {
        throw new Error("Failed to update user");
      }

      await dbSession.commitTransaction();

      // ✅ Success logging
      console.log(
        `Subscription successful: User ${user.email} subscribed to ${plan.name} plan`
      );

      return NextResponse.json({
        success: true,
        message: `Successfully subscribed to ${plan.name} plan`,
        newBalance: userBalance - amount,
        plan: {
          id: plan.id,
          name: plan.name,
          maxLeads: plan.maxLeads,
          maxUsers: plan.maxUsers,
        },
      });
    } catch (error) {
      await dbSession.abortTransaction();
      console.error("Subscription transaction failed:", error);
      throw error;
    } finally {
      dbSession.endSession();
    }
  } catch (error) {
    console.error("Error processing subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
