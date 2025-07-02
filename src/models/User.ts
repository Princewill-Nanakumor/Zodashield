// src/models/User.ts
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
  },
  country: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["ADMIN", "SUBADMIN", "AGENT"],
    default: "AGENT",
  },
  status: {
    type: String,
    enum: ["ACTIVE", "INACTIVE"],
    default: "ACTIVE",
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  permissions: [
    {
      type: String,
      enum: [
        "ASSIGN_LEADS",
        "DELETE_COMMENTS",
        "VIEW_PHONE_NUMBERS",
        "VIEW_EMAILS",
        "MANAGE_USERS",
        "EDIT_LEAD_STATUS",
      ],
    },
  ],
  emailVerified: {
    type: Boolean,
    default: false,
    required: true,
  },
  verificationToken: {
    type: String,
    default: null,
  },
  verificationExpires: {
    type: Date,
    default: null,
  },
  // Password reset fields
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
});

userSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

userSchema.index({ createdBy: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ verificationToken: 1 });
userSchema.index({ resetPasswordToken: 1 });

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
