import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import { ObjectId } from "mongodb";
import { Status } from "@/models/Status";
import { authOptions } from "@/libs/auth";

function extractIdFromUrl(urlString: string): string {
  const url = new URL(urlString);
  const parts = url.pathname.split("/");
  // Assumes route: /api/statuses/[id]
  // e.g. /api/statuses/123 -> parts = ["", "api", "statuses", "123"]
  return parts[parts.length - 1];
}

export async function PUT(request: Request) {
  try {
    const id = extractIdFromUrl(request.url);

    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { name, color } = await request.json();

    if (!name || !color) {
      return NextResponse.json(
        { message: "Name and color are required" },
        { status: 400 }
      );
    }

    await connectMongoDB();

    const updatedStatus = await Status.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { name, color } },
      { new: true }
    );

    if (!updatedStatus) {
      return NextResponse.json(
        { message: "Status not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Status updated successfully",
      data: updatedStatus,
    });
  } catch (error) {
    console.error("Error updating status:", error);
    return NextResponse.json(
      { message: "Error updating status" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const id = extractIdFromUrl(request.url);

    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const deletedStatus = await Status.findOneAndDelete({
      _id: new ObjectId(id),
    });

    if (!deletedStatus) {
      return NextResponse.json(
        { message: "Status not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Status deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting status:", error);
    return NextResponse.json(
      { message: "Error deleting status" },
      { status: 500 }
    );
  }
}
