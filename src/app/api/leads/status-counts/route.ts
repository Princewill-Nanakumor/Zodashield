import { NextResponse } from "next/server";
import { connectMongoDB } from "@/libs/dbConfig";
import Lead from "@/models/Lead";
import { Status } from "@/models/Status";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectMongoDB();

    // Get all statuses
    const statuses = await Status.find({});

    // Get total leads count (all leads, regardless of status)
    const allLeadsCount = await Lead.countDocuments();

    // Check if status is stored as ObjectId or string
    const sampleLead = await Lead.findOne({});
    const isObjectId =
      sampleLead &&
      sampleLead.status &&
      mongoose.isValidObjectId(sampleLead.status);

    let statusCounts: {
      id: string;
      name: string;
      color: string;
      count: number;
      isDeleted: boolean;
    }[] = [];

    if (isObjectId) {
      // If status is ObjectId, use $lookup to get status name
      const results = await Lead.aggregate([
        {
          $lookup: {
            from: "statuses",
            localField: "status",
            foreignField: "_id",
            as: "statusObj",
          },
        },
        { $unwind: { path: "$statusObj", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$statusObj.name",
            count: { $sum: 1 },
          },
        },
      ]);
      statusCounts = statuses.map((status) => {
        const found = results.find(
          (item) =>
            typeof item._id === "string" &&
            item._id.localeCompare(status.name, undefined, {
              sensitivity: "accent",
            }) === 0
        );
        return {
          id: status.name,
          name: status.name,
          color: status.color,
          count: found ? found.count : 0,
          isDeleted: false,
        };
      });
    } else {
      // If status is string, do a case-insensitive count for each status
      statusCounts = await Promise.all(
        statuses.map(async (status) => {
          const count = await Lead.countDocuments({
            status: { $regex: new RegExp(`^${status.name}$`, "i") },
          });
          return {
            id: status.name,
            name: status.name,
            color: status.color,
            count,
            isDeleted: false,
          };
        })
      );
    }

    // Add "All Leads" as the first item
    statusCounts.unshift({
      id: "ALL",
      name: "All Leads",
      color: "#6366F1", // You can pick any color you want for "All Leads"
      count: allLeadsCount,
      isDeleted: false,
    });

    // Totals
    const totalStatuses = statuses.length;
    const totalLeads = allLeadsCount;

    return NextResponse.json({
      statusCounts,
      totalStatuses,
      totalLeads,
    });
  } catch (error) {
    console.error("Error in status-counts route:", error);
    return NextResponse.json(
      { error: "Failed to fetch status counts" },
      { status: 500 }
    );
  }
}
