import mongoose, { Schema } from "mongoose";

export interface IStatus {
  _id: mongoose.Types.ObjectId;
  name: string;
  color: string;
  adminId: mongoose.Types.ObjectId; // For multi-tenancy
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

const statusSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
statusSchema.index({ adminId: 1 });
statusSchema.index({ name: 1, adminId: 1 }, { unique: true });

const Status =
  mongoose.models.Status || mongoose.model<IStatus>("Status", statusSchema);

export default Status;
