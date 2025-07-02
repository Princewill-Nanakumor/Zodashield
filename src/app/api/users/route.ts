// src/app/api/users/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectMongoDB } from "@/libs/dbConfig";
import User from "@/models/User";
import Activity from "@/models/Activity";
import { authOptions } from "@/libs/auth";
import Lead from "@/models/Lead";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const {
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      country,
      role,
      status,
      permissions,
    } = await request.json();

    await connectMongoDB();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phoneNumber,
      country,
      role,
      status,
      permissions,
      createdBy: session.user.id,
    });

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: newUser._id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "Error creating user" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectMongoDB();

    const query = {
      createdBy: session.user.id,
      role: { $ne: "ADMIN" },
    };

    const users = await User.find(query)
      .select(
        "_id firstName lastName email role status phoneNumber country permissions"
      )
      .sort({ firstName: 1, lastName: 1 });

    const transformedUsers = users.map((user) => ({
      id: user._id.toString(),
      name: `${user.firstName} ${user.lastName}`,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      country: user.country,
      role: user.role,
      status: user.status,
      permissions: user.permissions,
    }));

    return NextResponse.json(transformedUsers);
  } catch (error: unknown) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { message: "Error fetching users" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const {
      id,
      firstName,
      lastName,
      email,
      phoneNumber,
      country,
      role,
      permissions,
      status,
    } = await request.json();

    await connectMongoDB();

    const updatedUser = await User.findOneAndUpdate(
      { _id: id, createdBy: session.user.id },
      {
        firstName,
        lastName,
        email,
        phoneNumber,
        country,
        role,
        permissions,
        status,
        updatedAt: new Date(),
      },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error: unknown) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Error updating user" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // Check if user exists and belongs to current admin
    const userToDelete = await User.findOne({
      _id: id,
      createdBy: session.user.id,
    });

    if (!userToDelete) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const dbSession = await mongoose.startSession();

    try {
      await dbSession.withTransaction(async () => {
        // 1. Get all leads assigned to this user
        const assignedLeads = await Lead.find({
          assignedTo: id,
          createdBy: session.user.id,
        }).session(dbSession);

        // 2. Unassign all leads from this user
        const updateLeadsResult = await Lead.updateMany(
          {
            assignedTo: id,
            createdBy: session.user.id,
          },
          {
            $unset: { assignedTo: "" },
            $set: {
              updatedAt: new Date(),
              status: "NEW",
            },
          },
          { session: dbSession }
        );

        // 3. Create activities for unassigned leads using your Activity model
        const activityPromises = assignedLeads.map(async (lead) => {
          const activity = new Activity({
            type: "ASSIGNMENT",
            userId: new mongoose.Types.ObjectId(session.user.id),
            details: `Lead unassigned due to user deletion`,
            leadId: lead._id,
            timestamp: new Date(),
            metadata: {
              assignedTo: null,
              assignedFrom: {
                id: userToDelete._id.toString(),
                firstName: userToDelete.firstName,
                lastName: userToDelete.lastName,
              },
              assignedBy: {
                id: session.user.id,
                firstName: session.user.firstName || "Admin",
                lastName: session.user.lastName || "User",
              },
            },
          });

          await activity.save({ session: dbSession });
        });

        await Promise.all(activityPromises);

        // 4. Delete the user
        const deleteUserResult = await User.deleteOne(
          {
            _id: id,
            createdBy: session.user.id,
          },
          { session: dbSession }
        );

        if (deleteUserResult.deletedCount === 0) {
          throw new Error("Failed to delete user");
        }

        console.log(
          `User ${id} deleted. ${updateLeadsResult.modifiedCount} leads unassigned.`
        );
      });

      return NextResponse.json({
        message:
          "User deleted successfully and all assigned leads have been unassigned",
        deletedUserId: id,
        unassignedLeadsCount: 0,
      });
    } finally {
      await dbSession.endSession();
    }
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "Error deleting user",
      },
      { status: 500 }
    );
  }
}
