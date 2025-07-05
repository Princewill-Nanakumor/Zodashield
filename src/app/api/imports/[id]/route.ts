// /Users/safeconnection/Downloads/drivecrm-main/src/app/api/imports/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/libs/dbConfig";
import Import from "@/models/Import";
import { authOptions } from "@/libs/auth";

export async function PATCH(request: NextRequest) {
  try {
    // Extract the id from the URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split("/");
    const id = pathParts[pathParts.length - 1];

    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    await connectMongoDB();

    const updatedImport = await Import.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true }
    );

    if (!updatedImport) {
      return NextResponse.json(
        { message: "Import not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedImport);
  } catch (error) {
    console.error("Error updating import:", error);
    return NextResponse.json(
      { message: "Error updating import" },
      { status: 500 }
    );
  }
}
