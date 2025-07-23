// src/app/api/users/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { withDatabase, executeDbOperation } from "@/libs/dbConfig";
import { authOptions } from "@/libs/auth";

type UserUpdateFields = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  country?: string;
  role?: string;
  permissions?: string[];
  status?: string;
};
// Define interfaces for better type safety
interface UserDocument {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  country?: string;
  role: string;
  status: string;
  permissions?: string[];
  adminId?: mongoose.Types.ObjectId; // For multi-tenancy
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

interface LeadDocument {
  _id: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId; // For multi-tenancy
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  updatedAt: Date;
}

// Define query type for MongoDB filters
interface UserQuery {
  adminId?: mongoose.Types.ObjectId;
  role?: { $ne: string };
}

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

    // Check for existing user BEFORE using executeDbOperation
    const existingUser = await withDatabase(async () => {
      const db = mongoose.connection.db;
      if (!db) throw new Error("Database connection not available");
      return await db.collection("users").findOne({ email });
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Now proceed with user creation
    const result = await executeDbOperation(async () => {
      const db = mongoose.connection.db;
      if (!db) throw new Error("Database connection not available");

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await db.collection("users").insertOne({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        phoneNumber,
        country,
        role: role || "AGENT",
        status: status || "ACTIVE",
        permissions: permissions || [],
        adminId: new mongoose.Types.ObjectId(session.user.id),
        createdBy: new mongoose.Types.ObjectId(session.user.id),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const createdUser = (await db
        .collection("users")
        .findOne({ _id: newUser.insertedId })) as UserDocument | null;

      if (!createdUser) {
        throw new Error("Failed to create user");
      }

      return {
        message: "User created successfully",
        user: {
          id: createdUser._id,
          firstName: createdUser.firstName,
          lastName: createdUser.lastName,
          email: createdUser.email,
          role: createdUser.role,
          status: createdUser.status,
          createdAt: createdUser.createdAt.toISOString(),
        },
      };
    }, "Error creating user");

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating user:", error);
    const message =
      error instanceof Error ? error.message : "Error creating user";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const users = await withDatabase(async () => {
      const db = mongoose.connection.db;
      if (!db) throw new Error("Database connection not available");

      const query: UserQuery = {};

      if (session.user.role === "ADMIN") {
        // Admin sees only users they created (AGENT users with their adminId)
        query.adminId = new mongoose.Types.ObjectId(session.user.id);
      } else if (session.user.role === "AGENT") {
        // Agents don't see other users
        return [];
      }

      const users = (await db
        .collection("users")
        .find(query, {
          projection: {
            _id: 1,
            firstName: 1,
            lastName: 1,
            email: 1,
            role: 1,
            status: 1,
            phoneNumber: 1,
            country: 1,
            permissions: 1,
            createdAt: 1,
            lastLogin: 1,
          },
        })
        .sort({ firstName: 1, lastName: 1 })
        .toArray()) as UserDocument[];

      return users.map((user: UserDocument) => ({
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
        createdAt: user.createdAt ? user.createdAt.toISOString() : undefined,
        lastLogin: user.lastLogin ? user.lastLogin.toISOString() : undefined,
      }));
    });

    return NextResponse.json(users);
  } catch (error: unknown) {
    console.error("Error fetching users:", error);
    const message =
      error instanceof Error ? error.message : "Error fetching users";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log("Session:", session);

    if (!session || !session.user || session.user.role !== "ADMIN") {
      console.log("Unauthorized access attempt");
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

    console.log("Request body:", {
      id,
      firstName,
      lastName,
      email,
      phoneNumber,
      country,
      role,
      permissions,
      status,
    });

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      console.log("Invalid user ID:", id);
      return NextResponse.json({ message: "Invalid user ID" }, { status: 400 });
    }

    const userId = new mongoose.Types.ObjectId(id);
    const adminId = new mongoose.Types.ObjectId(session.user.id);

    const updateFields: UserUpdateFields = {};
    if (firstName !== undefined) updateFields.firstName = firstName;
    if (lastName !== undefined) updateFields.lastName = lastName;
    if (email !== undefined) updateFields.email = email;
    if (phoneNumber !== undefined) updateFields.phoneNumber = phoneNumber;
    if (country !== undefined) updateFields.country = country;
    if (role !== undefined) updateFields.role = role;
    if (permissions !== undefined) updateFields.permissions = permissions;
    if (status !== undefined) updateFields.status = status;

    // Prevent admin from changing their own role/status
    if (userId.equals(adminId)) {
      if (role !== undefined && role !== "ADMIN") {
        console.log("Admin tried to change their own role");
        return NextResponse.json(
          {
            message:
              "Administrators cannot change their own role to non-admin.",
          },
          { status: 403 }
        );
      }
      if (status !== undefined && status !== "active") {
        console.log("Admin tried to change their own status");
        return NextResponse.json(
          { message: "Administrators cannot change their own status." },
          { status: 403 }
        );
      }
    }

    const db = mongoose.connection.db;
    if (!db) {
      console.log("Database connection not available");
      return NextResponse.json(
        { message: "Database connection not available" },
        { status: 500 }
      );
    }

    // Main update query
    console.log("Update query:", {
      _id: userId,
      $or: [
        { adminId: adminId },
        { adminId: { $exists: false } },
        { _id: adminId },
      ],
    });
    console.log("Update fields:", updateFields);

    const adminScopedUpdateResult = await db
      .collection("users")
      .findOneAndUpdate(
        {
          _id: userId,
          $or: [
            { adminId: adminId },
            { adminId: { $exists: false } },
            { _id: adminId },
          ],
        },
        { $set: updateFields },
        { returnDocument: "after", projection: { password: 0 } }
      );

    console.log("adminScopedUpdateResult:", adminScopedUpdateResult);

    let updatedUser;
    if (adminScopedUpdateResult && adminScopedUpdateResult.value) {
      updatedUser = adminScopedUpdateResult.value;
      console.log("User updated (v4+):", updatedUser);
    } else if (adminScopedUpdateResult) {
      updatedUser = adminScopedUpdateResult;
      console.log("User updated (v3):", updatedUser);
    } else {
      // Check if the user exists at all
      const existingUser = await db
        .collection("users")
        .findOne({ _id: userId }, { projection: { adminId: 1 } });

      console.log("existingUser:", existingUser);

      if (!existingUser) {
        console.log("User not found");
        return NextResponse.json(
          { message: "User not found." },
          { status: 404 }
        );
      }

      if (existingUser.adminId && !existingUser.adminId.equals(adminId)) {
        console.log("User belongs to another admin");
        return NextResponse.json(
          {
            message:
              "Forbidden: Cannot update user belonging to another admin.",
          },
          { status: 403 }
        );
      }

      console.log("Failed to update user for unknown reason");
      return NextResponse.json(
        { message: "Failed to update user." },
        { status: 500 }
      );
    }

    // Transform user for frontend
    const userResponse = {
      id: updatedUser._id.toString(),
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      phoneNumber: updatedUser.phoneNumber,
      country: updatedUser.country,
      role: updatedUser.role,
      status: updatedUser.status,
      permissions: updatedUser.permissions,
      createdBy: updatedUser.createdBy?.toString?.() ?? "",
      createdAt: updatedUser.createdAt,
      lastLogin: updatedUser.lastLogin,
    };

    console.log("Returning user:", userResponse);

    return NextResponse.json({
      message: "User updated successfully",
      user: userResponse,
    });
  } catch (error: unknown) {
    console.error("Error in PUT /api/users/[id]:", error);
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ message }, { status: 500 });
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

    const result = await withDatabase(async () => {
      const db = mongoose.connection.db;
      if (!db) throw new Error("Database connection not available");

      // Check if user exists and belongs to current admin
      const userToDelete = (await db.collection("users").findOne({
        _id: new mongoose.Types.ObjectId(id),
        adminId: new mongoose.Types.ObjectId(session.user.id), // Multi-tenancy filter
      })) as UserDocument | null;

      if (!userToDelete) {
        throw new Error("User not found");
      }

      const dbSession = await mongoose.startSession();
      let assignedLeadsCount = 0;

      try {
        await dbSession.withTransaction(async () => {
          // 1. Get all leads assigned to this user (filtered by adminId)
          const assignedLeads = (await db
            .collection("leads")
            .find({
              assignedTo: new mongoose.Types.ObjectId(id),
              adminId: new mongoose.Types.ObjectId(session.user.id), // Multi-tenancy filter
            })
            .toArray()) as LeadDocument[];

          assignedLeadsCount = assignedLeads.length;

          // 2. Unassign all leads from this user and clear assignment metadata
          const updateLeadsResult = await db.collection("leads").updateMany(
            {
              assignedTo: new mongoose.Types.ObjectId(id),
              adminId: new mongoose.Types.ObjectId(session.user.id), // Multi-tenancy filter
            },
            {
              $unset: {
                assignedTo: "",
                assignedAt: "",
                assignedBy: "",
              },
              $set: {
                updatedAt: new Date(),
                status: "NEW",
              },
            }
          );

          // 3. Create activities for unassigned leads with proper metadata
          const activityPromises = assignedLeads.map(
            async (lead: LeadDocument) => {
              const activityData = {
                type: "ASSIGNMENT",
                userId: new mongoose.Types.ObjectId(session.user.id),
                details: `Lead unassigned due to user deletion: ${userToDelete.firstName} ${userToDelete.lastName}`,
                leadId: lead._id,
                timestamp: new Date(),
                metadata: {
                  assignedTo: null,
                  assignedFrom: {
                    id: userToDelete._id.toString(),
                    firstName: userToDelete.firstName,
                    lastName: userToDelete.lastName,
                    email: userToDelete.email,
                  },
                  assignedBy: {
                    id: session.user.id,
                    firstName: session.user.firstName || "Admin",
                    lastName: session.user.lastName || "User",
                  },
                  reason: "user_deletion",
                },
              };

              await db.collection("activities").insertOne(activityData);
            }
          );

          await Promise.all(activityPromises);

          // 4. Delete the user
          const deleteUserResult = await db.collection("users").deleteOne({
            _id: new mongoose.Types.ObjectId(id),
            adminId: new mongoose.Types.ObjectId(session.user.id), // Multi-tenancy filter
          });

          if (deleteUserResult.deletedCount === 0) {
            throw new Error("Failed to delete user");
          }

          console.log(
            `User ${id} deleted. ${updateLeadsResult.modifiedCount} leads unassigned.`
          );
        });

        return {
          message:
            "User deleted successfully and all assigned leads have been unassigned",
          deletedUserId: id,
          unassignedLeadsCount: assignedLeadsCount,
        };
      } finally {
        await dbSession.endSession();
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error deleting user:", error);
    const message =
      error instanceof Error ? error.message : "Error deleting user";
    return NextResponse.json({ message }, { status: 500 });
  }
}
