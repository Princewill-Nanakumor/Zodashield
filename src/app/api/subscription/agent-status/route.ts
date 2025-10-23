// src/app/api/subscription/agent-status/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import User from "@/models/User";
import { authOptions } from "@/libs/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    // Find the agent user
    const agent = await User.findById(session.user.id);

    if (!agent) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only allow agents to access this endpoint
    if (agent.role !== "AGENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find the admin who created this agent
    const admin = await User.findById(agent.createdBy);

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Calculate admin's trial status
    const now = new Date();
    const trialEndDate = admin.trialEndsAt ? new Date(admin.trialEndsAt) : null;
    const isOnTrial = admin.isOnTrial && trialEndDate && now < trialEndDate;
    const trialExpired = trialEndDate && now > trialEndDate;

    // Check if admin's subscription has expired
    const subscriptionEndDate = admin.subscriptionEndDate
      ? new Date(admin.subscriptionEndDate)
      : null;
    const subscriptionExpired =
      subscriptionEndDate && now > subscriptionEndDate;

    // Determine admin's subscription status
    let subscriptionStatus: "active" | "inactive" | "trial" | "expired";

    if (admin.subscriptionStatus === "active") {
      // If subscription is marked as active but end date has passed, mark as expired
      if (subscriptionExpired) {
        subscriptionStatus = "expired";
      } else {
        subscriptionStatus = "active";
      }
    } else if (isOnTrial) {
      subscriptionStatus = "trial";
    } else if (trialExpired) {
      subscriptionStatus = "expired";
    } else {
      subscriptionStatus = "inactive";
    }

    // Return the admin's subscription data (not the agent's)
    return NextResponse.json({
      isOnTrial: isOnTrial,
      trialEndsAt: admin.trialEndsAt,
      currentPlan: admin.currentPlan,
      subscriptionStatus,
      balance: admin.balance || 0,
      // Include admin info for context
      adminName: `${admin.firstName} ${admin.lastName}`,
      adminEmail: admin.email,
    });
  } catch (error) {
    console.error("Error fetching agent subscription status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
