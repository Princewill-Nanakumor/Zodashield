// /Users/safeconnection/Downloads/drivecrm/src/app/api/leads/user-leads/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { connectMongoDB } from "@/libs/dbConfig";
import Lead from "@/models/Lead";

// Define query type for MongoDB filters
interface LeadQuery {
  adminId?: string;
  assignedTo?: string;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const query: LeadQuery = {};

    if (session.user.role === "ADMIN") {
      // Admin sees all leads that belong to them
      query.adminId = session.user.id;
    } else if (session.user.role === "AGENT") {
      // Agent sees only leads assigned to them from their admin
      query.assignedTo = session.user.id;
      if (session.user.adminId) {
        query.adminId = session.user.adminId;
      }
    }

    const leads = await Lead.find(query).sort({ createdAt: -1 });

    return NextResponse.json(leads);
  } catch (error) {
    console.error("Error fetching user leads:", error);
    return NextResponse.json(
      { message: "Failed to fetch leads" },
      { status: 500 }
    );
  }
}
