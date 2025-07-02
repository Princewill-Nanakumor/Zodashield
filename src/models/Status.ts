// src/models/Status.ts
import mongoose from "mongoose";

const StatusSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export const Status =
  mongoose.models.Status || mongoose.model("Status", StatusSchema);
