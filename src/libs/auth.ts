// src/libs/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectMongoDB } from "./dbConfig";
import User from "@/models/User";

// Extend the built-in session types
declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: "ADMIN" | "SUBADMIN" | "AGENT";
    permissions: string[];
    status: string;
    emailVerified: boolean;
    adminId?: string; // For multi-tenancy - AGENT users have adminId
  }

  interface Session {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      name: string;
      role: "ADMIN" | "SUBADMIN" | "AGENT";
      permissions: string[];
      status: string;
      emailVerified: boolean;
      adminId?: string; // For multi-tenancy - AGENT users have adminId
    };
  }
}

// Extend the built-in JWT types
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "SUBADMIN" | "AGENT";
    permissions: string[];
    status: string;
    firstName: string;
    lastName: string;
    emailVerified: boolean;
    adminId?: string; // For multi-tenancy - AGENT users have adminId
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
          throw new Error("Please enter an email and password");
        }

        try {
          await connectMongoDB();

          const user = await User.findOne({
            email: credentials.email,
          });

          if (!user) {
            console.log("❌ User not found or no password");
            throw new Error("Invalid email or password");
          }

          // Check if user is active
          if (user.status === "INACTIVE") {
            throw new Error(
              "Your account has been deactivated. Please contact support."
            );
          }

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!passwordMatch) {
            throw new Error("Incorrect password");
          }

          // Update last login time
          await User.findByIdAndUpdate(user._id, {
            lastLogin: new Date(),
          });

          return {
            id: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role as "ADMIN" | "SUBADMIN" | "AGENT",
            permissions: user.permissions,
            status: user.status,
            emailVerified: Boolean(user.emailVerified),
            adminId: user.adminId?.toString(), // Include adminId for multi-tenancy
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
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/signin",
    error: "/signin?error=true",
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
        token.emailVerified = Boolean(user.emailVerified);
        token.adminId = user.adminId; // Include adminId in JWT
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
        session.user.name = `${token.firstName} ${token.lastName}`;
        session.user.emailVerified = Boolean(token.emailVerified);
        session.user.adminId = token.adminId; // Include adminId in session
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
