import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import Payment from "@/models/Payment";
import User from "@/models/User";
import { connectMongoDB } from "@/libs/dbConfig";
import { Types } from "mongoose";
import mongoose from "mongoose";

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

export async function POST(
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

    // Validate paymentId format
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return NextResponse.json(
        { error: "Invalid payment ID" },
        { status: 400 }
      );
    }

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
        { error: "Super admin access required to reject payments" },
        { status: 403 }
      );
    }

    // Find the payment
    const payment = (await Payment.findById(
      paymentId
    ).lean()) as PaymentDocument | null;

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending payments can be rejected" },
        { status: 400 }
      );
    }

    // Update payment status and rejection info
    const updatedPayment = (await Payment.findByIdAndUpdate(
      paymentId,
      {
        status: "FAILED",
        approvedAt: new Date(), // Consider renaming this to 'processedAt' since it's used for both approve/reject
        approvedBy: user._id, // Consider renaming this to 'processedBy'
      },
      { new: true, runValidators: true }
    ).lean()) as PaymentDocument | null;

    if (!updatedPayment) {
      return NextResponse.json(
        { error: "Failed to update payment" },
        { status: 500 }
      );
    }

    // Create notification for the admin who made the payment (with deduplication)
    if (!mongoose.connection.db) {
      throw new Error("Database connection not established");
    }

    const dedupKey = `payment_rejected_${paymentId}`;
    const notificationsCol = mongoose.connection.db.collection("notifications");
    const now = new Date();

    const notificationDoc = {
      type: "PAYMENT_REJECTED",
      message: `Your payment of ${payment.amount} ${payment.currency} has been rejected`,
      role: "ADMIN",
      link: `/dashboard/payment-details/${paymentId}`, // Fixed link to match your routes
      paymentId: paymentId,
      amount: payment.amount,
      currency: payment.currency,
      userId: payment.adminId?.toString(),
      createdAt: now.toISOString(),
      read: false,
      timestamp: now.getTime(),
      deduplicationKey: dedupKey,
    };

    // Use atomic upsert to prevent duplicates
    await notificationsCol.updateOne(
      { deduplicationKey: dedupKey },
      { $setOnInsert: notificationDoc },
      { upsert: true }
    );

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
      message: "Payment rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
