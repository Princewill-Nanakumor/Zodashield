// src/lib/usageLimits.ts
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import User from "@/models/User";
import Lead from "@/models/Lead";
import { authOptions } from "@/libs/auth";

export interface UsageLimits {
  canImport: boolean;
  canAddTeamMember: boolean;
  currentLeads: number;
  maxLeads: number;
  currentUsers: number;
  maxUsers: number;
  remainingLeads: number;
  remainingUsers: number;
  isOverLimit: boolean; // New field to indicate if user exceeds current plan limits
  overLimitBy: number; // How many leads over the limit
}

export async function checkUsageLimits(): Promise<UsageLimits> {
  const session = await getServerSession(authOptions);

  if (!session) {
    throw new Error("Unauthorized");
  }

  await connectMongoDB();
  const user = await User.findById(session.user.id);

  if (!user) {
    throw new Error("User not found");
  }

  // Get current usage
  const currentLeads = await Lead.countDocuments({
    adminId: user.role === "ADMIN" ? user._id : user.adminId,
  });

  const currentUsers = await User.countDocuments({
    adminId: user.role === "ADMIN" ? user._id : user.adminId,
  });

  // Check if user is on trial or has active subscription
  const now = new Date();
  const isOnTrial =
    user.isOnTrial && user.trialEndsAt && now < new Date(user.trialEndsAt);

  // Check if subscription has expired
  const subscriptionEndDate = user.subscriptionEndDate
    ? new Date(user.subscriptionEndDate)
    : null;
  const subscriptionExpired = subscriptionEndDate && now > subscriptionEndDate;
  const hasActiveSubscription =
    user.subscriptionStatus === "active" && !subscriptionExpired;

  if (!isOnTrial && !hasActiveSubscription) {
    return {
      canImport: false,
      canAddTeamMember: false,
      currentLeads,
      maxLeads: 0,
      currentUsers,
      maxUsers: 0,
      remainingLeads: 0,
      remainingUsers: 0,
      isOverLimit: false,
      overLimitBy: 0,
    };
  }

  // Get limits based on subscription
  const maxLeads = user.maxLeads || 50; // Default trial limit
  const maxUsers = user.maxUsers || 1; // Default trial limit

  // Check if user is over their current plan limits (downgrade scenario)
  const isOverLimit = currentLeads > maxLeads;
  const overLimitBy = Math.max(0, currentLeads - maxLeads);

  const result = {
    canImport: currentLeads < maxLeads,
    canAddTeamMember: currentUsers < maxUsers,
    currentLeads,
    maxLeads,
    currentUsers,
    maxUsers,
    remainingLeads: Math.max(0, maxLeads - currentLeads),
    remainingUsers: Math.max(0, maxUsers - currentUsers),
    isOverLimit,
    overLimitBy,
  };

  return result;
}
