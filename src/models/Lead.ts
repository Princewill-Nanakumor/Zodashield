// src/models/Lead.ts
import mongoose, { Schema } from "mongoose";

export interface ILead {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  status: "NEW" | "CONTACTED" | "IN_PROGRESS" | "QUALIFIED" | "LOST" | "WON";
  source: string;
  comments: string;
  importId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

const leadSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
      default: "",
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      default: "",
    },
    country: {
      required: true,
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["NEW", "CONTACTED", "IN_PROGRESS", "QUALIFIED", "LOST", "WON"],
      default: "NEW",
    },
    source: {
      type: String,
      trim: true,
      default: "-",
    },
    comments: {
      type: String,
      default: "No comments yet",
    },
    importId: {
      type: Schema.Types.ObjectId,
      ref: "Import",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

leadSchema.index({ email: 1 }, { unique: true });

const Lead = mongoose.models.Lead || mongoose.model<ILead>("Lead", leadSchema);

export default Lead;
