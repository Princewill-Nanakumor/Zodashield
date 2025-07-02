// app/api/leads/[id]/comments/[commentId]/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import { authOptions } from "@/libs/auth";
import Comment from "@/models/Comment";
import Activity from "@/models/Activity";
import mongoose from "mongoose";

function extractParamsFromUrl(urlString: string): {
  id: string;
  commentId: string;
} {
  const url = new URL(urlString);
  const parts = url.pathname.split("/");
  const commentId = parts[parts.length - 1];
  const id = parts[parts.length - 3];
  return { id, commentId };
}

export async function PUT(request: Request) {
  try {
    const { id, commentId } = extractParamsFromUrl(request.url);
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

    const updated = await Comment.findOneAndUpdate(
      { _id: commentId, leadId: id },
      { content: content.trim() },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json(
        { message: "Comment not found" },
        { status: 404 }
      );
    }

    // Create activity log for comment edit
    const activity = new Activity({
      type: "COMMENT",
      userId: new mongoose.Types.ObjectId(session.user.id),
      details: "Edited a comment",
      leadId: new mongoose.Types.ObjectId(id),
      timestamp: new Date(),
      metadata: {
        commentContent: content.trim(),
      },
    });

    await activity.save();

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating comment:", error);
    return NextResponse.json(
      { message: "Error updating comment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id, commentId } = extractParamsFromUrl(request.url);
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const deleted = await Comment.findOneAndDelete({
      _id: commentId,
      leadId: id,
    });

    if (!deleted) {
      return NextResponse.json(
        { message: "Comment not found" },
        { status: 404 }
      );
    }

    // Create activity log for comment deletion
    const activity = new Activity({
      type: "COMMENT",
      userId: new mongoose.Types.ObjectId(session.user.id),
      details: "Deleted a comment",
      leadId: new mongoose.Types.ObjectId(id),
      timestamp: new Date(),
    });

    await activity.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { message: "Error deleting comment" },
      { status: 500 }
    );
  }
}
