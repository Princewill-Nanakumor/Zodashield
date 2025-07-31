// src/app/scripts/fixTrialDates.ts
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set in environment variables");
  process.exit(1);
}

const MONGODB_URI_WITH_DB =
  MONGODB_URI.replace(/\/$/, "") + "/your_default_db_name";

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
    balance: {
      type: Number,
      default: 0,
    },
    isOnTrial: {
      type: Boolean,
      default: true,
    },
    trialEndsAt: Date,
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

// Define the update data interface
interface UpdateData {
  trialEndsAt: Date;
  subscriptionStatus?: "active" | "inactive" | "trial" | "expired";
  isOnTrial?: boolean;
}

async function fixTrialDates() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI_WITH_DB);
    console.log("Connected to MongoDB successfully!");

    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to update\n`);

    let updatedCount = 0;
    let expiredCount = 0;

    for (const user of users) {
      const registrationDate = new Date(user.createdAt);

      // Calculate correct trial end date (3 days from registration)
      const correctTrialEnd = new Date(registrationDate);
      correctTrialEnd.setDate(registrationDate.getDate() + 3);

      // Check if trial should be expired
      const now = new Date();
      const shouldBeExpired = correctTrialEnd <= now;

      console.log(`User: ${user.email}`);
      console.log(`  Registered: ${registrationDate}`);
      console.log(`  Current Trial End: ${user.trialEndsAt}`);
      console.log(`  Correct Trial End: ${correctTrialEnd}`);
      console.log(`  Should be expired: ${shouldBeExpired}`);

      // Update the user with proper typing
      const updateData: UpdateData = {
        trialEndsAt: correctTrialEnd,
      };

      // If trial should be expired, update status
      if (shouldBeExpired && user.subscriptionStatus === "trial") {
        updateData.subscriptionStatus = "expired";
        updateData.isOnTrial = false;
        expiredCount++;
      }

      await User.updateOne({ _id: user._id }, { $set: updateData });

      updatedCount++;
      console.log(`  ✅ Updated`);
      console.log("---");
    }

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total users updated: ${updatedCount}`);
    console.log(`Users marked as expired: ${expiredCount}`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed.");
  }
}

fixTrialDates();
