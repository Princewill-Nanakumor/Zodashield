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

    console.log("Debug info:", {
      userEmail: user.email,
      userRole: user.role,
      superAdminEmails,
      isSuperAdmin:
        user.role === "ADMIN" && superAdminEmails.includes(user.email),
      sessionUserEmail: session.user.email,
    });

    const isSuperAdmin =
      user.role === "ADMIN" && superAdminEmails.includes(user.email);

    // Add debugging information
    console.log("Debug info:", {
      userEmail: user.email,
      userRole: user.role,
      superAdminEmails,
      isSuperAdmin,
      sessionUserEmail: session.user.email,
    });

    if (!isSuperAdmin) {
      return NextResponse.json(
        {
          error: "Super admin access required to approve payments",
          debug: {
            userEmail: user.email,
            userRole: user.role,
            superAdminEmails,
            isSuperAdmin,
          },
        },
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
        { error: "Only pending payments can be approved" },
        { status: 400 }
      );
    }

    // Get the admin who created the payment
    const admin = (await User.findById(
      payment.adminId
    ).lean()) as UserDocument | null;

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Update payment status and approval info
    const updatedPayment = (await Payment.findByIdAndUpdate(
      paymentId,
      {
        status: "COMPLETED",
        approvedAt: new Date(),
        approvedBy: user._id,
      },
      { new: true, runValidators: true }
    ).lean()) as PaymentDocument | null;

    if (!updatedPayment) {
      return NextResponse.json(
        { error: "Failed to update payment" },
        { status: 500 }
      );
    }

    // Update admin's balance
    const updatedAdmin = (await User.findByIdAndUpdate(
      payment.adminId,
      {
        $inc: { balance: payment.amount },
      },
      { new: true, runValidators: true }
    ).lean()) as UserDocument | null;

    if (!updatedAdmin) {
      return NextResponse.json(
        { error: "Failed to update admin balance" },
        { status: 500 }
      );
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
      message: `Payment approved successfully. Admin balance updated to ${updatedAdmin.balance}`,
    });
  } catch (error) {
    console.error("Error approving payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
