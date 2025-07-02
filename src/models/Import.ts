// src/models/Import.ts
import mongoose from "mongoose";

const importSchema = new mongoose.Schema(
  {
    fileName: {
      type: String,
      required: true,
    },
    recordCount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["New", "processing", "completed", "failed"],
      default: "New",
    },
    successCount: {
      type: Number,
      default: 0,
    },
    failureCount: {
      type: Number,
      default: 0,
    },
    timestamp: {
      type: Number,
      required: true,
    },
    uploadedBy: {
      // Changed back to uploadedBy to match existing data
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Import = mongoose.models.Import || mongoose.model("Import", importSchema);
export default Import;
