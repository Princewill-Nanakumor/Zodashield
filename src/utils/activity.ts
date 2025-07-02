// src/utils/activity.ts

import { connectMongoDB } from "@/libs/dbConfig";
import Activity from "@/models/Activity";

// Define metadata types
export interface ActivityMetadata {
  count?: number;
  successCount?: number;
  failureCount?: number;
  source?: string;
  fileName?: string;
  error?: string;
  status?: "success" | "failed";
  changes?: Record<string, unknown>;
  previousValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
}

export interface ActivityLogParams {
  type: "CREATE" | "UPDATE" | "DELETE" | "IMPORT" | "EXPORT" | "ERROR";
  userId: string;
  details: string;
  metadata?: ActivityMetadata;
  leadId?: string;
}

export async function logActivity({
  type,
  userId,
  details,
  metadata = {},
  leadId,
}: ActivityLogParams) {
  try {
    await connectMongoDB();

    const activity = new Activity({
      type,
      userId,
      details,
      metadata,
      leadId,
      timestamp: new Date(),
    });

    await activity.save();

    return activity;
  } catch (error) {
    console.error(
      "Error logging activity:",
      error instanceof Error ? error.message : "Unknown error"
    );
    // Don't throw the error - we don't want activity logging to break the main functionality
    return null;
  }
}
