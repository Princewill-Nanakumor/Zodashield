import mongoose, { Schema } from "mongoose";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber: string;
  country: string;
  role: "ADMIN" | "AGENT";
  status: "ACTIVE" | "INACTIVE";
  permissions: string[];
  adminId?: mongoose.Types.ObjectId; // For multi-tenancy - AGENT users have adminId, ADMIN users don't
  createdBy?: mongoose.Types.ObjectId; // For AGENT users, this is their admin
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  __v: number;
}

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: "",
    },
    country: {
      type: String,
      trim: true,
      default: "",
    },
    role: {
      type: String,
      enum: ["ADMIN", "AGENT"],
      default: "AGENT",
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    permissions: {
      type: [String],
      default: [],
    },
    adminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to validate conditional required fields
userSchema.pre("save", function (next) {
  if (this.role === "AGENT") {
    if (!this.adminId) {
      return next(new Error("adminId is required for AGENT users"));
    }
    if (!this.createdBy) {
      return next(new Error("createdBy is required for AGENT users"));
    }
  }
  next();
});

// Indexes for better performance and multi-tenancy
// Compound unique index for email + adminId to ensure emails are unique per admin
userSchema.index({ email: 1, adminId: 1 }, { unique: true, sparse: true });
// For ADMIN users (no adminId), ensure email is unique globally
userSchema.index(
  { email: 1, role: 1 },
  { unique: true, partialFilterExpression: { role: "ADMIN" } }
);
userSchema.index({ adminId: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });

const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
