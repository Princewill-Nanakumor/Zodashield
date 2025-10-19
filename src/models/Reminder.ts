// src/models/Reminder.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IReminder extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  reminderDate: Date;
  reminderTime: string; // Format: "HH:mm"
  type: "CALL" | "EMAIL" | "TASK" | "MEETING";
  status: "PENDING" | "COMPLETED" | "SNOOZED" | "DISMISSED";
  leadId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId; // Multi-tenancy
  snoozedUntil?: Date;
  completedAt?: Date;
  notificationSent: boolean;
  soundEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reminderSchema = new Schema<IReminder>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    reminderDate: {
      type: Date,
      required: true,
    },
    reminderTime: {
      type: String,
      required: true,
      match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
    },
    type: {
      type: String,
      enum: ["CALL", "EMAIL", "TASK", "MEETING"],
      default: "TASK",
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "SNOOZED", "DISMISSED"],
      default: "PENDING",
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    snoozedUntil: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
    soundEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
reminderSchema.index({ leadId: 1, assignedTo: 1 });
reminderSchema.index({ adminId: 1, status: 1 });
reminderSchema.index({ assignedTo: 1, status: 1, reminderDate: 1 });
reminderSchema.index({ reminderDate: 1, status: 1 });
// Optimized index for due reminders query
reminderSchema.index({
  adminId: 1,
  assignedTo: 1,
  status: 1,
  reminderDate: 1,
  reminderTime: 1,
});

const Reminder =
  mongoose.models.Reminder ||
  mongoose.model<IReminder>("Reminder", reminderSchema);

export default Reminder;
