// app/api/leads/[id]/comments/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { connectMongoDB } from "@/libs/dbConfig";
import { authOptions } from "@/libs/auth";
import Comment, { IComment } from "@/models/Comment";
import Activity from "@/models/Activity";

function extractLeadIdFromUrl(urlString: string): string {
  const url = new URL(urlString);
  const parts = url.pathname.split("/");
  return parts[parts.length - 2];
}

export async function GET(request: Request) {
  try {
    const id = extractLeadIdFromUrl(request.url);
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();
    const leadObjectId = new mongoose.Types.ObjectId(id);

    const comments = await Comment.find({ leadId: leadObjectId })
      .sort({ createdAt: -1 })
      .lean<IComment[]>();

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error in comments GET endpoint:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching comments",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const id = extractLeadIdFromUrl(request.url);
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { content } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { message: "Comment content is required" },
        { status: 400 }
      );
    }

    await connectMongoDB();
    const leadObjectId = new mongoose.Types.ObjectId(id);

    const comment = new Comment({
      leadId: leadObjectId,
      content: content.trim(),
      createdBy: {
        _id: session.user.id,
        firstName: session.user.firstName,
        lastName: session.user.lastName,
      },
    });

    const savedComment = await comment.save();

    // Create activity log for the comment
    const activity = new Activity({
      type: "COMMENT",
      userId: new mongoose.Types.ObjectId(session.user.id),
      details: "Added a comment",
      leadId: leadObjectId,
      timestamp: new Date(),
      metadata: {
        commentContent: content.trim(),
      },
    });

    await activity.save();

    return NextResponse.json(savedComment);
  } catch (error) {
    console.error("Error in comments POST endpoint:", error);
    return NextResponse.json(
      { message: "Error creating comment" },
      { status: 500 }
    );
  }
}
