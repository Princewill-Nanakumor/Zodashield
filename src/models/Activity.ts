// Update your existing Activity model to include user-specific activities
import mongoose from "mongoose";

export type ActivityType =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "IMPORT"
  | "STATUS_CHANGE"
  | "ASSIGNMENT"
  | "COMMENT"
  | "LEAD_CREATED"
  // Add user-specific activity types
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "USER_CREATED"
  | "USER_UPDATED"
  | "USER_DELETED"
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_UPDATED"
  | "SUBSCRIPTION_CANCELLED"
  | "PROFILE_UPDATED"
  | "PASSWORD_CHANGED"
  | "PERMISSION_CHANGED";

export interface IActivity {
  type: ActivityType;
  userId: mongoose.Types.ObjectId;
  details: string;
  timestamp: Date;
  leadId?: mongoose.Types.ObjectId;
  adminId?: mongoose.Types.ObjectId;
  metadata: {
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
    // Add user-specific metadata
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    targetUserId?: string; // For admin actions on other users
    subscriptionPlan?: string;
    subscriptionStatus?: string;
    permissionChanges?: Array<{
      permission: string;
      granted: boolean;
    }>;
  };
}

export interface IActivityDocument extends IActivity, mongoose.Document {}

const activitySchema = new mongoose.Schema<IActivityDocument>(
  {
    type: {
      type: String,
      required: true,
      enum: [
        "CREATE",
        "UPDATE",
        "DELETE",
        "IMPORT",
        "STATUS_CHANGE",
        "ASSIGNMENT",
        "COMMENT",
        "LEAD_CREATED",
        "USER_LOGIN",
        "USER_LOGOUT",
        "USER_CREATED",
        "USER_UPDATED",
        "USER_DELETED",
        "SUBSCRIPTION_CREATED",
        "SUBSCRIPTION_UPDATED",
        "SUBSCRIPTION_CANCELLED",
        "PROFILE_UPDATED",
        "PASSWORD_CHANGED",
        "PERMISSION_CHANGED",
      ],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: false,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      index: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Existing indexes
activitySchema.index({ leadId: 1, timestamp: -1 });
activitySchema.index({ userId: 1 });
activitySchema.index({ type: 1 });
activitySchema.index({ "metadata.oldStatusId": 1 });
activitySchema.index({ "metadata.newStatusId": 1 });
activitySchema.index({ leadId: 1, adminId: 1 });
activitySchema.index({ adminId: 1, timestamp: -1 });

// Add new indexes for user activities
activitySchema.index({ type: 1, adminId: 1, timestamp: -1 }); // For filtering user activities by admin
activitySchema.index({ "metadata.targetUserId": 1 }); // For admin actions on specific users

activitySchema.pre("save", function (this: IActivityDocument, next) {
  if (!this.metadata || typeof this.metadata !== "object") {
    next(new Error("Invalid metadata"));
    return;
  }
  next();
});

const Activity =
  mongoose.models.Activity ||
  mongoose.model<IActivityDocument>("Activity", activitySchema);

export default Activity;
