// models/Comment.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IComment extends Document {
  leadId: mongoose.Types.ObjectId;
  content: string;
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

export default mongoose.models.Comment ||
  mongoose.model<IComment>("Comment", CommentSchema);
