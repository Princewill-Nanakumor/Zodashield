import mongoose, { Schema } from "mongoose";

export interface IImport {
  _id: mongoose.Types.ObjectId;
  fileName: string;
  recordCount: number;
  status: string;
  successCount: number;
  failureCount: number;
  timestamp: number;
  uploadedBy: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId; // For multi-tenancy
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

const importSchema = new Schema(
  {
    fileName: { type: String, required: true },
    recordCount: { type: Number, required: true },
    status: { type: String, default: "new" },
    successCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    timestamp: { type: Number, default: Date.now },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Indexes for better performance
importSchema.index({ adminId: 1 }); // Multi-tenancy index
importSchema.index({ uploadedBy: 1 });
importSchema.index({ createdAt: -1 });

const Import =
  mongoose.models.Import || mongoose.model<IImport>("Import", importSchema);

export default Import;
