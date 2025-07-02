// src/utils/activityLogger.ts
import Activity from "@/models/Activity";

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

export interface ActivityLog {
  type: "CREATE" | "UPDATE" | "DELETE" | "IMPORT";
  userId: string;
  details: string;
  metadata?: ActivityMetadata;
}

export async function logActivity({
  type,
  userId,
  details,
  metadata = {},
}: ActivityLog): Promise<void> {
  try {
    await Activity.create({
      type,
      userId,
      details,
      metadata,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}
