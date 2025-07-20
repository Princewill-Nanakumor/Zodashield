// /Users/safeconnection/Downloads/drivecrm/src/app/api/payments/[paymentId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import Payment from "@/models/Payment";
import User from "@/models/User";
import { connectMongoDB } from "@/libs/dbConfig";
import { Types } from "mongoose";

interface PaymentDocument {
  _id: Types.ObjectId;
  amount: number;
  currency: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  method: "CREDIT_CARD" | "PAYPAL" | "BANK_TRANSFER" | "CRYPTO";
  transactionId: string;
  description?: string;
  network?: "TRC20" | "ERC20";
  walletAddress?: string;
  createdAt: string;
  approvedAt?: string;
  createdBy?: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  adminId?: Types.ObjectId;
}

interface UserDocument {
  _id: Types.ObjectId;
  email: string;
  role: string;
  name?: string;
  balance?: number;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    await connectMongoDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await the params to get the paymentId
    const { paymentId } = await params;

    // Find the payment
    const payment = (await Payment.findById(
      paymentId
    ).lean()) as PaymentDocument | null;

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Get user info to check if they're a super admin
    const user = (await User.findOne({
      email: session.user.email,
    }).lean()) as UserDocument | null;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is admin or if they own this payment
    const isAdmin = user.role === "ADMIN";
    const isOwner =
      payment.createdBy && payment.createdBy.toString() === user._id.toString();

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Convert MongoDB ObjectId to string for JSON response
    const paymentResponse = {
      ...payment,
      _id: String(payment._id),
      createdBy: payment.createdBy ? String(payment.createdBy) : undefined,
      approvedBy: payment.approvedBy ? String(payment.approvedBy) : undefined,
      adminId: payment.adminId ? String(payment.adminId) : undefined,
    };

    return NextResponse.json({
      success: true,
      payment: paymentResponse,
    });
  } catch (error) {
    console.error("Error fetching payment details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    await connectMongoDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await the params to get the paymentId
    const { paymentId } = await params;
    const body = await request.json();

    // Get user info to check if they're a super admin
    const user = (await User.findOne({
      email: session.user.email,
    }).lean()) as UserDocument | null;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is super admin
    const superAdminEmails =
      process.env.SUPER_ADMIN_EMAILS?.split(",").map((email) => email.trim()) ||
      [];
    const isSuperAdmin =
      user.role === "ADMIN" && superAdminEmails.includes(user.email);

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Super admin access required" },
        { status: 403 }
      );
    }

    // Find and update the payment
    const updatedPayment = (await Payment.findByIdAndUpdate(
      paymentId,
      { ...body },
      { new: true, runValidators: true }
    ).lean()) as PaymentDocument | null;

    if (!updatedPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Convert MongoDB ObjectId to string for JSON response
    const paymentResponse = {
      ...updatedPayment,
      _id: String(updatedPayment._id),
      createdBy: updatedPayment.createdBy
        ? String(updatedPayment.createdBy)
        : undefined,
      approvedBy: updatedPayment.approvedBy
        ? String(updatedPayment.approvedBy)
        : undefined,
      adminId: updatedPayment.adminId
        ? String(updatedPayment.adminId)
        : undefined,
    };

    return NextResponse.json({
      success: true,
      payment: paymentResponse,
    });
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    await connectMongoDB();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Await the params to get the paymentId
    const { paymentId } = await params;

    // Get user info to check if they're a super admin
    const user = (await User.findOne({
      email: session.user.email,
    }).lean()) as UserDocument | null;

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is super admin
    const superAdminEmails =
      process.env.SUPER_ADMIN_EMAILS?.split(",").map((email) => email.trim()) ||
      [];
    const isSuperAdmin =
      user.role === "ADMIN" && superAdminEmails.includes(user.email);

    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Super admin access required" },
        { status: 403 }
      );
    }

    // Find and delete the payment
    const deletedPayment = (await Payment.findByIdAndDelete(
      paymentId
    ).lean()) as PaymentDocument | null;

    if (!deletedPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Payment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
