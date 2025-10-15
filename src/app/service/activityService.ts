// src/services/activityService.ts
import Activity, { ActivityType } from "@/models/Activity";
import mongoose from "mongoose";

// Define a proper type for metadata
interface ActivityMetadata {
  contactId?: string;
  email?: string;
  count?: number;
  source?: string;
  oldValue?: string;
  newValue?: string;
  status?: string;
  oldStatus?: string;
  newStatus?: string;
  oldStatusId?: string;
  newStatusId?: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  assignedFrom?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  assignedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  commentContent?: string;
  oldCommentContent?: string;
  changes?: Array<{
    field: string;
    oldValue: string | null;
    newValue: string | null;
  }>;
  // User-specific metadata
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  targetUserId?: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  permissionChanges?: Array<{
    permission: string;
    granted: boolean;
  }>;
  // Allow for additional properties with index signature
  [key: string]: unknown;
  // Reminder-specific metadata
  reminderId?: string;
  reminderTitle?: string;
  reminderType?: string;
  reminderDate?: string;
  reminderTime?: string;
  reminderStatus?: string;
  oldReminderStatus?: string;
  snoozedUntil?: string;
  completedAt?: string;
  soundEnabled?: boolean;
}

interface CreateActivityParams {
  type: ActivityType;
  userId: string;
  adminId?: string;
  leadId?: string;
  details: string;
  metadata?: ActivityMetadata;
}

export class ActivityService {
  static async createActivity({
    type,
    userId,
    adminId,
    leadId,
    details,
    metadata = {},
  }: CreateActivityParams) {
    try {
      const activity = new Activity({
        type,
        userId: new mongoose.Types.ObjectId(userId),
        adminId: adminId ? new mongoose.Types.ObjectId(adminId) : undefined,
        leadId: leadId ? new mongoose.Types.ObjectId(leadId) : undefined,
        details,
        metadata,
        timestamp: new Date(),
      });

      await activity.save();
      return activity;
    } catch (error) {
      console.error("Error creating activity:", error);
      throw error;
    }
  }

  // User login activity
  static async logUserLogin(
    userId: string,
    adminId: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    return this.createActivity({
      type: "USER_LOGIN",
      userId,
      adminId,
      details: "User logged in",
      metadata: {
        ipAddress,
        userAgent,
        sessionId: Date.now().toString(),
      },
    });
  }

  // User logout activity
  static async logUserLogout(userId: string, adminId: string) {
    return this.createActivity({
      type: "USER_LOGOUT",
      userId,
      adminId,
      details: "User logged out",
    });
  }

  // Admin creates user
  static async logUserCreated(
    adminId: string,
    targetUserId: string,
    userEmail: string
  ) {
    return this.createActivity({
      type: "USER_CREATED",
      userId: adminId,
      adminId,
      details: `Created user: ${userEmail}`,
      metadata: {
        targetUserId,
        email: userEmail,
      },
    });
  }

  // Admin updates user
  static async logUserUpdated(
    adminId: string,
    targetUserId: string,
    changes: Array<{
      field: string;
      oldValue: string | null;
      newValue: string | null;
    }>
  ) {
    return this.createActivity({
      type: "USER_UPDATED",
      userId: adminId,
      adminId,
      details: `Updated user profile`,
      metadata: {
        targetUserId,
        changes,
      },
    });
  }

  // Subscription activity
  static async logSubscriptionActivity(
    adminId: string,
    type:
      | "SUBSCRIPTION_CREATED"
      | "SUBSCRIPTION_UPDATED"
      | "SUBSCRIPTION_CANCELLED",
    plan: string,
    status: string
  ) {
    return this.createActivity({
      type,
      userId: adminId,
      adminId,
      details: `${type.replace("_", " ").toLowerCase()} - ${plan} plan`,
      metadata: {
        subscriptionPlan: plan,
        subscriptionStatus: status,
      },
    });
  }

  // Get activities for admin dashboard
  static async getAdminActivities(adminId: string, limit = 50) {
    return Activity.find({ adminId: new mongoose.Types.ObjectId(adminId) })
      .populate("userId", "firstName lastName email")
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }

  // Get user-specific activities
  static async getUserActivities(userId: string, adminId: string, limit = 50) {
    return Activity.find({
      userId: new mongoose.Types.ObjectId(userId),
      adminId: new mongoose.Types.ObjectId(adminId),
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
  }

  // Get activity statistics
  static async getActivityStats(adminId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return Activity.aggregate([
      {
        $match: {
          adminId: new mongoose.Types.ObjectId(adminId),
          timestamp: { $gte: startDate },
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
      {
        $group: {
          _id: "$_id.date",
          activities: {
            $push: {
              type: "$_id.type",
              count: "$count",
            },
          },
          totalCount: { $sum: "$count" },
        },
      },
      { $sort: { _id: -1 } },
    ]);
  }

  // Reminder activity logging methods
  static async logReminderCreated(
    userId: string,
    adminId: string,
    leadId: string,
    reminderId: string,
    reminderTitle: string,
    reminderType: string,
    reminderDate: string,
    reminderTime: string,
    soundEnabled: boolean = true
  ) {
    return this.createActivity({
      type: "REMINDER_CREATED",
      userId,
      adminId,
      leadId,
      details: `Created reminder: ${reminderTitle}`,
      metadata: {
        reminderId,
        reminderTitle,
        reminderType,
        reminderDate,
        reminderTime,
        reminderStatus: "PENDING",
        soundEnabled,
      },
    });
  }

  static async logReminderUpdated(
    userId: string,
    adminId: string,
    leadId: string,
    reminderId: string,
    reminderTitle: string,
    reminderType: string,
    changes: string[]
  ) {
    return this.createActivity({
      type: "REMINDER_UPDATED",
      userId,
      adminId,
      leadId,
      details: `Updated reminder: ${reminderTitle}${changes.length > 0 ? ` (${changes.join(", ")})` : ""}`,
      metadata: {
        reminderId,
        reminderTitle,
        reminderType,
        reminderStatus: "PENDING",
      },
    });
  }

  static async logReminderCompleted(
    userId: string,
    adminId: string,
    leadId: string,
    reminderId: string,
    reminderTitle: string,
    completedAt: Date
  ) {
    return this.createActivity({
      type: "REMINDER_COMPLETED",
      userId,
      adminId,
      leadId,
      details: `Marked reminder as completed: ${reminderTitle}`,
      metadata: {
        reminderId,
        reminderTitle,
        reminderStatus: "COMPLETED",
        completedAt: completedAt.toISOString(),
      },
    });
  }

  static async logReminderSnoozed(
    userId: string,
    adminId: string,
    leadId: string,
    reminderId: string,
    reminderTitle: string,
    snoozedUntil: Date
  ) {
    return this.createActivity({
      type: "REMINDER_SNOOZED",
      userId,
      adminId,
      leadId,
      details: `Snoozed reminder until ${snoozedUntil.toLocaleString()}: ${reminderTitle}`,
      metadata: {
        reminderId,
        reminderTitle,
        reminderStatus: "SNOOZED",
        snoozedUntil: snoozedUntil.toISOString(),
      },
    });
  }

  static async logReminderDismissed(
    userId: string,
    adminId: string,
    leadId: string,
    reminderId: string,
    reminderTitle: string
  ) {
    return this.createActivity({
      type: "REMINDER_DISMISSED",
      userId,
      adminId,
      leadId,
      details: `Dismissed reminder: ${reminderTitle}`,
      metadata: {
        reminderId,
        reminderTitle,
        reminderStatus: "DISMISSED",
      },
    });
  }

  static async logReminderDeleted(
    userId: string,
    adminId: string,
    leadId: string,
    reminderId: string,
    reminderTitle: string,
    reminderType: string,
    reminderDate: string,
    reminderTime: string
  ) {
    return this.createActivity({
      type: "REMINDER_DELETED",
      userId,
      adminId,
      leadId,
      details: `Deleted reminder: ${reminderTitle}`,
      metadata: {
        reminderId,
        reminderTitle,
        reminderType,
        reminderDate,
        reminderTime,
      },
    });
  }

  static async logReminderMuted(
    userId: string,
    adminId: string,
    leadId: string,
    reminderId: string,
    reminderTitle: string
  ) {
    return this.createActivity({
      type: "REMINDER_MUTED",
      userId,
      adminId,
      leadId,
      details: `Muted reminder: ${reminderTitle}`,
      metadata: {
        reminderId,
        reminderTitle,
        soundEnabled: false,
      },
    });
  }

  static async logReminderUnmuted(
    userId: string,
    adminId: string,
    leadId: string,
    reminderId: string,
    reminderTitle: string
  ) {
    return this.createActivity({
      type: "REMINDER_UNMUTED",
      userId,
      adminId,
      leadId,
      details: `Unmuted reminder: ${reminderTitle}`,
      metadata: {
        reminderId,
        reminderTitle,
        soundEnabled: true,
      },
    });
  }
}
