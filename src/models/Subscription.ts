// src/models/Subscription.ts
import mongoose, { Schema } from "mongoose";

export interface ISubscription {
  _id: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId;
  plan: "BASIC" | "PRO" | "ENTERPRISE";
  status: "ACTIVE" | "CANCELLED" | "EXPIRED" | "PENDING";
  startDate: Date;
  endDate: Date;
  maxUsers: number;
  maxLeads: number;
  features: string[];
  billingCycle: "MONTHLY" | "YEARLY";
  amount: number;
  currency: string;
  paymentMethod?: string;
  lastBillingDate?: Date;
  nextBillingDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    plan: {
      type: String,
      enum: ["BASIC", "PRO", "ENTERPRISE"],
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "CANCELLED", "EXPIRED", "PENDING"],
      default: "PENDING",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    maxUsers: {
      type: Number,
      required: true,
    },
    maxLeads: {
      type: Number,
      required: true,
    },
    features: {
      type: [String],
      default: [],
    },
    billingCycle: {
      type: String,
      enum: ["MONTHLY", "YEARLY"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "USD",
    },
    paymentMethod: String,
    lastBillingDate: Date,
    nextBillingDate: Date,
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.index({ adminId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1 });

const Subscription =
  mongoose.models.Subscription ||
  mongoose.model<ISubscription>("Subscription", subscriptionSchema);

export default Subscription;
