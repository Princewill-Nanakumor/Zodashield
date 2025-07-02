// src/models/Activity.ts
import mongoose from "mongoose";

export type ActivityType =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "IMPORT"
  | "STATUS_CHANGE"
  | "ASSIGNMENT"
  | "COMMENT"
  | "LEAD_CREATED";

export interface IActivity {
  // Common fields
  type: ActivityType;
  userId: mongoose.Types.ObjectId;
  details: string;
  timestamp: Date;

  // Lead-specific fields (optional for general activities)
  leadId?: mongoose.Types.ObjectId;

  // Metadata for flexible data storage
  metadata: {
    // Contact/Lead related
    contactId?: string;
    email?: string;
    count?: number;
    source?: string;

    // Status changes
    oldValue?: string;
    newValue?: string;
    status?: string;
    oldStatus?: string;
    newStatus?: string;
    oldStatusId?: string;
    newStatusId?: string;

    // Assignment related
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

    // Comment related
    commentContent?: string;
    oldCommentContent?: string;

    // General changes tracking
    changes?: Array<{
      field: string;
      oldValue: string | null;
      newValue: string | null;
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
    // Optional leadId for lead-specific activities
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: false, // Not required for general activities
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Add indexes for better performance
activitySchema.index({ leadId: 1, timestamp: -1 });
activitySchema.index({ "metadata.contactId": 1, timestamp: -1 });
activitySchema.index({ userId: 1 });
activitySchema.index({ type: 1 });

// Middleware for validation
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
