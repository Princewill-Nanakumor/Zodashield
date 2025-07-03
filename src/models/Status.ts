// src/models/Status.ts
import mongoose from "mongoose";

export interface IStatus {
  name: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

// Remove _id from IStatus since Document already provides it
export interface IStatusDocument extends IStatus, mongoose.Document {}

const StatusSchema = new mongoose.Schema<IStatusDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
        },
        message: "Color must be a valid hex color (e.g., #FF0000 or #F00)",
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Status =
  mongoose.models.Status ||
  mongoose.model<IStatusDocument>("Status", StatusSchema);
