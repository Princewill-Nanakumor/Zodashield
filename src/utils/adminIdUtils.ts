// src/utils/adminIdUtils.ts
import mongoose from "mongoose";

// Define session user interface
interface SessionUser {
  id: string;
  role: "ADMIN" | "AGENT";
  adminId?: string;
  firstName?: string;
  lastName?: string;
}

// Define session interface
interface Session {
  user: SessionUser;
}

// Utility function to determine correct adminId based on user role
export function getCorrectAdminId(session: Session): mongoose.Types.ObjectId {
  if (session.user.role === "ADMIN") {
    return new mongoose.Types.ObjectId(session.user.id);
  } else if (session.user.role === "AGENT" && session.user.adminId) {
    return new mongoose.Types.ObjectId(session.user.adminId);
  }
  throw new Error("Invalid user role or missing adminId for agent");
}

// Utility function to build multi-tenancy query
export function buildMultiTenancyQuery(
  session: Session,
  baseQuery: Record<string, unknown> = {}
): Record<string, unknown> {
  const adminId = getCorrectAdminId(session);
  return {
    ...baseQuery,
    adminId: adminId,
  };
}

// Utility function to log adminId information for debugging
export function logAdminIdInfo(session: Session, context: string) {
  console.log(`=== ${context} ===`);
  console.log("User ID:", session.user.id);
  console.log("User Role:", session.user.role);
  console.log("Session adminId:", session.user.adminId);
  console.log("Computed adminId:", getCorrectAdminId(session).toString());
}
