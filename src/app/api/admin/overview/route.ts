import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { connectMongoDB } from "@/libs/dbConfig";
import User from "@/models/User";
import Lead from "@/models/Lead";
import Subscription from "@/models/Subscription";
import Activity from "@/models/Activity";
import Payment from "@/models/Payment";

// Define proper types for the subscription
interface SubscriptionData {
  plan: string;
  status: string;
  maxUsers: number;
  maxLeads: number;
  endDate: Date;
}

// Helper function to safely access subscription properties
function extractSubscriptionData(
  subscription: unknown
): SubscriptionData | null {
  if (!subscription || typeof subscription !== "object") return null;

  const sub = subscription as Record<string, unknown>;

  return {
    plan: (sub.plan as string) || "BASIC",
    status: (sub.status as string) || "PENDING",
    maxUsers: (sub.maxUsers as number) || 0,
    maxLeads: (sub.maxLeads as number) || 0,
    endDate: (sub.endDate as Date) || new Date(),
  };
}

// Helper function to safely transform lastAgentLogin
function extractLastAgentLogin(data: unknown) {
  if (!data || typeof data !== "object") return undefined;

  const agent = data as Record<string, unknown>;

  return {
    lastLogin: agent.lastLogin as Date | undefined,
    firstName: (agent.firstName as string) || "",
    lastName: (agent.lastName as string) || "",
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get allowed emails from environment variable
    const allowedEmails =
      process.env.SUPER_ADMIN_EMAILS?.split(",").map((email) => email.trim()) ||
      [];

    // Check if the user's email is in the allowed list
    if (
      allowedEmails.length > 0 &&
      !allowedEmails.includes(session.user.email)
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await connectMongoDB();

    // Get all admins (users with role ADMIN)
    const admins = await User.find({ role: "ADMIN" })
      .select("firstName lastName email status lastLogin createdAt balance")
      .lean();

    // Get stats for each admin
    const adminStats = await Promise.all(
      admins.map(async (admin) => {
        const adminId = admin._id;

        // Count agents under this admin
        const agentCount = await User.countDocuments({
          adminId: adminId,
          role: "AGENT",
        });

        // Count leads for this admin
        const leadCount = await Lead.countDocuments({
          adminId: adminId,
        });

        // Get subscription info
        const subscription = await Subscription.findOne({
          adminId: adminId,
          status: "ACTIVE",
        }).lean();

        // Get recent activity for this admin
        const recentActivity = await Activity.find({
          adminId: adminId,
        })
          .sort({ timestamp: -1 })
          .limit(5)
          .populate("userId", "firstName lastName email")
          .lean();

        // Get last agent login
        const lastAgentLoginRaw = await User.findOne({
          adminId: adminId,
          role: "AGENT",
        })
          .sort({ lastLogin: -1 })
          .select("lastLogin firstName lastName")
          .lean();

        // Get activity count for this admin
        const activityCount = await Activity.countDocuments({
          adminId: adminId,
        });

        // Get recent user login activities
        const recentLogins = await Activity.find({
          adminId: adminId,
          type: { $in: ["USER_LOGIN", "USER_LOGOUT"] },
        })
          .populate("userId", "firstName lastName email")
          .sort({ timestamp: -1 })
          .limit(3)
          .lean();

        // Get subscription activities
        const subscriptionActivities = await Activity.find({
          adminId: adminId,
          type: {
            $in: [
              "SUBSCRIPTION_CREATED",
              "SUBSCRIPTION_UPDATED",
              "SUBSCRIPTION_CANCELLED",
            ],
          },
        })
          .populate("userId", "firstName lastName email")
          .sort({ timestamp: -1 })
          .limit(3)
          .lean();

        // Get payment stats for this admin
        const paymentStats = await Payment.aggregate([
          { $match: { adminId: adminId } },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              totalAmount: { $sum: "$amount" },
            },
          },
        ]);

        // Safely access subscription properties
        const subscriptionData = extractSubscriptionData(subscription);

        // Safely transform lastAgentLogin
        const lastAgentLogin = extractLastAgentLogin(lastAgentLoginRaw);

        return {
          ...admin,
          agentCount,
          leadCount,
          activityCount,
          subscription: subscriptionData,
          recentActivity,
          recentLogins,
          subscriptionActivities,
          lastAgentLogin,
          paymentStats,
        };
      })
    );

    // Overall platform stats
    const totalAdmins = admins.length;
    const totalAgents = await User.countDocuments({ role: "AGENT" });
    const totalLeads = await Lead.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({
      status: "ACTIVE",
    });

    // Get total balance across all admins
    const totalBalance = await User.aggregate([
      { $match: { role: "ADMIN" } },
      {
        $group: {
          _id: null,
          totalBalance: { $sum: { $ifNull: ["$balance", 0] } },
        },
      },
    ]);

    // Get platform-wide activity stats
    const platformActivityStats = await Activity.aggregate([
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get recent platform activities
    const recentPlatformActivities = await Activity.find({})
      .populate("userId", "firstName lastName")
      .populate("adminId", "firstName lastName")
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();

    // Get user login stats
    const userLoginStats = await Activity.aggregate([
      {
        $match: {
          type: { $in: ["USER_LOGIN", "USER_LOGOUT"] },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            type: "$type",
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": -1 } },
      { $limit: 7 }, // Last 7 days
    ]);

    // Get payment stats across platform
    const platformPaymentStats = await Payment.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    return NextResponse.json({
      admins: adminStats,
      platformStats: {
        totalAdmins,
        totalAgents,
        totalLeads,
        activeSubscriptions,
        totalActivities: await Activity.countDocuments({}),
        totalBalance: totalBalance[0]?.totalBalance || 0,
      },
      platformActivityStats,
      recentPlatformActivities,
      userLoginStats,
      platformPaymentStats,
    });
  } catch (error) {
    console.error("Error fetching admin overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin overview" },
      { status: 500 }
    );
  }
}
