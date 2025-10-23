// src/lib/subscriptionGuard.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { connectMongoDB } from "@/libs/dbConfig";
import User from "@/models/User";

export async function checkSubscriptionAccess() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return { allowed: false, error: "Unauthorized" };
  }

  await connectMongoDB();
  const user = await User.findById(session.user.id);

  if (!user) {
    return { allowed: false, error: "User not found" };
  }

  // Check if subscription has expired
  const now = new Date();
  const subscriptionEndDate = user.subscriptionEndDate
    ? new Date(user.subscriptionEndDate)
    : null;
  const subscriptionExpired = subscriptionEndDate && now > subscriptionEndDate;

  // Check if trial has expired
  if (user.trialEndsAt) {
    const trialEnd = new Date(user.trialEndsAt);

    if (now > trialEnd && user.subscriptionStatus !== "active") {
      return { allowed: false, error: "Trial expired" };
    }
  }

  // Check if subscription is active and not expired
  if (user.subscriptionStatus === "active" && !subscriptionExpired) {
    return { allowed: true, user };
  }

  // Check if subscription is expired or inactive
  if (
    user.subscriptionStatus === "expired" ||
    user.subscriptionStatus === "inactive" ||
    subscriptionExpired
  ) {
    return { allowed: false, error: "Subscription required" };
  }

  // Check if user is on trial
  if (user.subscriptionStatus === "trial" && user.trialEndsAt) {
    const trialEnd = new Date(user.trialEndsAt);
    if (now < trialEnd) {
      return { allowed: true, user };
    } else {
      return { allowed: false, error: "Trial expired" };
    }
  }

  return { allowed: false, error: "Subscription required" };
}
