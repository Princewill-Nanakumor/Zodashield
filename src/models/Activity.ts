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
  type: ActivityType;
  userId: mongoose.Types.ObjectId;
  details: string;
  timestamp: Date;
  leadId?: mongoose.Types.ObjectId;
  adminId?: mongoose.Types.ObjectId; // Add multi-tenancy field
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
    leadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lead",
      required: false,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false, // Make it optional for backward compatibility
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

activitySchema.index({ leadId: 1, timestamp: -1 });
activitySchema.index({ userId: 1 });
activitySchema.index({ type: 1 });
activitySchema.index({ "metadata.oldStatusId": 1 });
activitySchema.index({ "metadata.newStatusId": 1 });
// Add multi-tenancy indexes
activitySchema.index({ leadId: 1, adminId: 1 });
activitySchema.index({ adminId: 1, timestamp: -1 });

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
