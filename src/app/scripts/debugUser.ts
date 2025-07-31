// src/app/scripts/debugUser.ts
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set in environment variables");
  process.exit(1);
}

// Update the URI to use the correct database
const MONGODB_URI_WITH_DB =
  MONGODB_URI.replace(/\/$/, "") + "/your_default_db_name";

// User Schema (exact same as in your User.ts model)
const userSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: String,
    password: String,
    phoneNumber: String,
    country: String,
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
    permissions: [String],
    adminId: mongoose.Schema.Types.ObjectId,
    createdBy: mongoose.Schema.Types.ObjectId,
    lastLogin: Date,

    // Subscription and billing fields
    balance: {
      type: Number,
      default: 0,
    },
    isOnTrial: {
      type: Boolean,
      default: true,
    },
    trialEndsAt: {
      type: Date,
      default: function () {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 3);
        return trialEnd;
      },
    },
    currentPlan: {
      type: String,
      enum: ["starter", "professional", "enterprise"],
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "inactive", "trial", "expired"],
      default: "trial",
    },
    subscriptionStartDate: Date,
    subscriptionEndDate: Date,
    maxLeads: {
      type: Number,
      default: 50,
    },
    maxUsers: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

async function debugUser() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI_WITH_DB);
    console.log("Connected to MongoDB successfully!");

    // Find all users with registration dates
    const users = await User.find({}).sort({ createdAt: -1 });

    console.log(`\nFound ${users.length} users:\n`);

    users.forEach((user, index) => {
      console.log(`User ${index + 1}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.firstName} ${user.lastName}`);
      console.log(`  Role: ${user.role}`);
      console.log(`  Registered: ${user.createdAt}`);
      console.log(`  Trial Ends: ${user.trialEndsAt}`);

      // Calculate trial duration
      const registrationDate = new Date(user.createdAt);
      const trialEndDate = new Date(user.trialEndsAt);
      const diffInDays =
        (trialEndDate.getTime() - registrationDate.getTime()) /
        (1000 * 60 * 60 * 24);

      console.log(`  Trial Duration: ${diffInDays.toFixed(2)} days`);
      console.log(`  Is On Trial: ${user.isOnTrial}`);
      console.log(`  Subscription Status: ${user.subscriptionStatus}`);

      // Calculate remaining time
      const now = new Date();
      const remainingTime = trialEndDate.getTime() - now.getTime();
      const remainingDays = remainingTime / (1000 * 60 * 60 * 24);

      if (remainingTime > 0) {
        console.log(`  Remaining Time: ${remainingDays.toFixed(2)} days`);
      } else {
        console.log(`  Trial Status: EXPIRED`);
      }

      console.log("---");
    });

    // Show summary
    console.log("\n=== SUMMARY ===");
    const activeTrials = users.filter((user) => {
      const trialEnd = new Date(user.trialEndsAt);
      const now = new Date();
      return trialEnd > now && user.subscriptionStatus === "trial";
    });

    const expiredTrials = users.filter((user) => {
      const trialEnd = new Date(user.trialEndsAt);
      const now = new Date();
      return trialEnd <= now || user.subscriptionStatus === "expired";
    });

    const activeSubscriptions = users.filter(
      (user) => user.subscriptionStatus === "active"
    );

    console.log(`Total Users: ${users.length}`);
    console.log(`Active Trials: ${activeTrials.length}`);
    console.log(`Expired Trials: ${expiredTrials.length}`);
    console.log(`Active Subscriptions: ${activeSubscriptions.length}`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
}

debugUser();
