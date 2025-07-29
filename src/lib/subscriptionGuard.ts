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

  // Check if trial has expired
  if (user.trialEndsAt) {
    const now = new Date();
    const trialEnd = new Date(user.trialEndsAt);

    if (now > trialEnd && user.subscriptionStatus !== "active") {
      return { allowed: false, error: "Trial expired" };
    }
  }

  // Check if subscription is active
  if (
    user.subscriptionStatus === "expired" ||
    user.subscriptionStatus === "inactive"
  ) {
    return { allowed: false, error: "Subscription required" };
  }

  return { allowed: true, user };
}
