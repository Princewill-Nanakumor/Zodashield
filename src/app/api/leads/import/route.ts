import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { connectMongoDB } from "@/libs/dbConfig";
import Lead from "@/models/Lead";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const leads = await request.json();
    console.log(
      "Received leads to import:",
      Array.isArray(leads) ? leads.length : 0
    );

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { error: "Invalid data format or empty array" },
        { status: 400 }
      );
    }

    // Transform leads to match your schema
    const transformedLeads = leads.map((lead) => {
      const [firstName, ...rest] = (lead.name || "").split(" ");
      return {
        firstName: firstName || "",
        lastName: rest.join(" ") || "",
        email: lead.email,
        phone: lead.phone || "",
        source: lead.source || "",
        status: "NEW",
        createdBy: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    console.log("First lead to be saved:", transformedLeads[0]);

    // Save leads in batches
    let results;
    try {
      results = await Lead.insertMany(transformedLeads, { ordered: false });
    } catch (err: unknown) {
      if (err && typeof err === "object" && "writeErrors" in err) {
        // @ts-expect-error: Mongo error type is not known
        const successCount = err.result?.nInserted || 0;
        return NextResponse.json({
          message: `Imported ${successCount} leads, some duplicates were skipped.`,
          totalProcessed: leads.length,
          successCount,
          error: "Some leads were not imported due to duplicates.",
        });
      }
      throw err;
    }

    console.log("Saved leads count:", results.length);

    return NextResponse.json({
      message: `Successfully imported ${results.length} leads`,
      totalProcessed: leads.length,
      successCount: results.length,
    });
  } catch (error) {
    console.error("Error in lead import:", error);
    return NextResponse.json(
      {
        error: "Failed to import leads",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
