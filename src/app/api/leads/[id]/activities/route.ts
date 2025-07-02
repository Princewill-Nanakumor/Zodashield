// app/api/leads/[id]/activities/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import Activity from "@/models/Activity";
import { authOptions } from "@/libs/auth";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const leadId = pathParts[pathParts.length - 2];

    console.log("Fetching activities for leadId:", leadId);

    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    await connectMongoDB();

    // Find activities where leadId matches the leadId
    const activities = await Activity.find({
      leadId: new mongoose.Types.ObjectId(leadId),
    })
      .populate("userId", "firstName lastName")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    console.log("Found activities:", activities.length);

    // Get status names for better display
    const db = mongoose.connection.db;
    if (!db) {
      console.error("Database connection not available");
      return NextResponse.json(
        { message: "Database connection error" },
        { status: 500 }
      );
    }

    // Use the correct collection name: 'status' (singular)
    const statusCollection = db.collection("status");

    // Check if status collection exists and has data
    const statusCount = await statusCollection.countDocuments();

    // Get all unique status IDs from activities
    const statusIds = new Set<string>();
    activities.forEach((activity) => {
      if (
        activity.metadata?.oldStatusId &&
        typeof activity.metadata.oldStatusId === "string" &&
        activity.metadata.oldStatusId.length === 24 &&
        mongoose.Types.ObjectId.isValid(activity.metadata.oldStatusId)
      ) {
        statusIds.add(activity.metadata.oldStatusId);
      }
      if (
        activity.metadata?.newStatusId &&
        typeof activity.metadata.newStatusId === "string" &&
        activity.metadata.newStatusId.length === 24 &&
        mongoose.Types.ObjectId.isValid(activity.metadata.newStatusId)
      ) {
        statusIds.add(activity.metadata.newStatusId);
      }
    });

    // Fetch status names
    const statusNames: Record<string, string> = {};
    if (statusIds.size > 0 && statusCount > 0) {
      const statusDocs = await statusCollection
        .find({
          _id: {
            $in: Array.from(statusIds).map(
              (id) => new mongoose.Types.ObjectId(id)
            ),
          },
        })
        .toArray();

      statusDocs.forEach((status) => {
        statusNames[status._id.toString()] = status.name;
      });
    }

    // Transform activities to match your UI's expected format
    const transformedActivities = activities.map((activity) => {
      const transformed = activity.toObject();

      // Transform the Activity model format to match your UI expectations
      const transformedActivity = {
        _id: transformed._id.toString(),
        leadId: transformed.leadId?.toString(),
        type: transformed.type,
        description: transformed.details, // Map details to description for frontend
        createdBy: transformed.userId, // Map userId to createdBy for frontend
        createdAt: transformed.timestamp, // Map timestamp to createdAt for frontend
        updatedAt: transformed.updatedAt,
        metadata: {
          oldValue: transformed.metadata?.oldValue,
          newValue: transformed.metadata?.newValue,
          oldStatus: transformed.metadata?.oldStatus,
          newStatus: transformed.metadata?.newStatus,
          oldStatusId: transformed.metadata?.oldStatusId,
          newStatusId: transformed.metadata?.newStatusId,
          assignedTo: transformed.metadata?.assignedTo,
          assignedFrom: transformed.metadata?.assignedFrom,
          assignedBy: transformed.metadata?.assignedBy,
          commentContent: transformed.metadata?.commentContent,
          oldCommentContent: transformed.metadata?.oldCommentContent,
          changes: transformed.metadata?.changes,
        },
      };

      // Handle populated userId field - FIXED THIS PART
      if (transformedActivity.createdBy) {
        // If it's an array (populated result), take the first element
        if (Array.isArray(transformedActivity.createdBy)) {
          transformedActivity.createdBy = transformedActivity.createdBy[0] || {
            _id: "unknown",
            firstName: "Unknown",
            lastName: "User",
          };
        }
        // If it's an object but doesn't have the expected structure, create a fallback
        else if (
          typeof transformedActivity.createdBy === "object" &&
          transformedActivity.createdBy !== null
        ) {
          // Ensure it has the expected structure
          if (
            !transformedActivity.createdBy.firstName ||
            !transformedActivity.createdBy.lastName
          ) {
            transformedActivity.createdBy = {
              _id: transformedActivity.createdBy._id || "unknown",
              firstName: transformedActivity.createdBy.firstName || "Unknown",
              lastName: transformedActivity.createdBy.lastName || "User",
            };
          }
        }
        // If it's a string or null, create a fallback
        else {
          transformedActivity.createdBy = {
            _id: "unknown",
            firstName: "Unknown",
            lastName: "User",
          };
        }
      } else {
        // If createdBy is null/undefined, create a fallback
        transformedActivity.createdBy = {
          _id: "unknown",
          firstName: "Unknown",
          lastName: "User",
        };
      }

      // Fix status names if they're IDs
      if (
        transformedActivity.metadata?.oldStatus &&
        statusNames[transformedActivity.metadata.oldStatus]
      ) {
        transformedActivity.metadata.oldStatus =
          statusNames[transformedActivity.metadata.oldStatus];
      }
      if (
        transformedActivity.metadata?.newStatus &&
        statusNames[transformedActivity.metadata.newStatus]
      ) {
        transformedActivity.metadata.newStatus =
          statusNames[transformedActivity.metadata.newStatus];
      }

      console.log("Transformed activity:", {
        type: transformedActivity.type,
        description: transformedActivity.description,
        createdBy: transformedActivity.createdBy,
        oldStatus: transformedActivity.metadata?.oldStatus,
        newStatus: transformedActivity.metadata?.newStatus,
        hasCommentContent: !!transformed.metadata?.commentContent,
        commentContent: transformed.metadata?.commentContent,
      });

      return transformedActivity;
    });

    console.log("Final transformed activities:", transformedActivities.length);

    return NextResponse.json(transformedActivities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
