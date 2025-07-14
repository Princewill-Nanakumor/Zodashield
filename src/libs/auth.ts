import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectMongoDB } from "./dbConfig";
import mongoose from "mongoose";

// Extend the built-in session types
declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions: string[];
    status: string;
    adminId?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      permissions: string[];
      status: string;
      adminId?: string;
    };
  }
}

// Extend the built-in JWT types
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    permissions: string[];
    status: string;
    firstName: string;
    lastName: string;
    adminId?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials");
          throw new Error("Please enter an email and password");
        }

        try {
          await connectMongoDB();

          console.log("🔍 Looking for user with email:", credentials.email);

          // Use direct MongoDB collection access like the debug endpoints
          const db = mongoose.connection.db;
          if (!db) {
            throw new Error("Database connection not available");
          }

          // Try to find user with exact email first
          let user = await db.collection("users").findOne({
            email: credentials.email,
          });

          // If not found, try with lowercase
          if (!user) {
            user = await db.collection("users").findOne({
              email: credentials.email.toLowerCase(),
            });
          }

          // If still not found, try with uppercase
          if (!user) {
            user = await db.collection("users").findOne({
              email: credentials.email.toUpperCase(),
            });
          }

          if (!user) {
            console.log("❌ User not found");
            throw new Error("Invalid email or password");
          }

          console.log("✅ User found:", {
            id: user._id,
            email: user.email,
            role: user.role,
            status: user.status,
            hasPassword: !!user.password,
          });

          // Check if user is active
          if (user.status === "INACTIVE") {
            console.log("❌ User is inactive");
            throw new Error(
              "Account is inactive. Please contact administrator."
            );
          }

          // Check if user has password
          if (!user.password) {
            console.log("❌ User has no password");
            throw new Error("Invalid email or password");
          }

          // Verify password
          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!passwordMatch) {
            console.log("❌ Password mismatch");
            throw new Error("Invalid email or password");
          }

          console.log("✅ Password verified successfully");

          // Update last login time
          await db
            .collection("users")
            .updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

          return {
            id: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            permissions: user.permissions || [],
            status: user.status,
            adminId: user.adminId?.toString(),
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
    updateAge: 60 * 60,
  },
  pages: {
    signIn: "/signin",
    error: "/signin?error=true",
    // Don't protect these pages
    newUser: "/signup",
    verifyRequest: "/forgot-password",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.permissions = user.permissions;
        token.status = user.status;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.adminId = user.adminId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.permissions = token.permissions;
        session.user.status = token.status;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.adminId = token.adminId;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
