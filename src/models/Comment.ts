// src/models/Comment.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IComment extends Document {
  leadId: mongoose.Types.ObjectId;
  content: string;
  adminId: mongoose.Types.ObjectId; // Multi-tenancy field
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  createdAt: Date;
  updatedAt?: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    leadId: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    adminId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true, // Add index for better query performance
    },
    createdBy: {
      _id: {
        type: String,
        required: true,
      },
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
      avatar: String,
    },
  },
  {
    timestamps: true,
  }
);

// Add compound index for multi-tenancy queries
CommentSchema.index({ leadId: 1, adminId: 1 });

const Comment =
  mongoose.models.Comment || mongoose.model<IComment>("Comment", CommentSchema);

export default Comment;
