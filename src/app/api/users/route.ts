// src/app/api/users/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { withDatabase, executeDbOperation } from "@/libs/dbConfig";
import { authOptions } from "@/libs/auth";

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
          },
        })
        .sort({ firstName: 1, lastName: 1 })
        .toArray()) as UserDocument[];

      // Include the admin user in the results
      const adminUser = await db.collection("users").findOne({
        _id: new mongoose.Types.ObjectId(session.user.id),
      });

      // Check if admin is not already in the results
      const adminExists =
        adminUser &&
        users.some((user) => user._id.toString() === adminUser._id.toString());

      // Create final array with admin included if needed
      const allUsers =
        adminUser && !adminExists
          ? [...users, adminUser as UserDocument]
          : users;

      return allUsers.map((user: UserDocument) => ({
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

    const result = await executeDbOperation(async () => {
      const db = mongoose.connection.db;
      if (!db) throw new Error("Database connection not available");

      const updatedUser = (await db.collection("users").findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(id),
          adminId: new mongoose.Types.ObjectId(session.user.id), // Multi-tenancy filter
        },
        {
          $set: {
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
        },
        { returnDocument: "after", projection: { password: 0 } }
      )) as UserDocument | null;

      if (!updatedUser) {
        throw new Error("User not found");
      }

      return {
        message: "User updated successfully",
        user: updatedUser,
      };
    }, "Error updating user");

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error updating user:", error);
    const message =
      error instanceof Error ? error.message : "Error updating user";
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
