import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { connectMongoDB } from "@/libs/dbConfig";
import { ObjectId } from "mongodb";
import Payment from "@/models/Payment";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const requestData = await request.json();
    await connectMongoDB();

    const user = await User.findById(session.user.id);
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const adminId = user.role === "ADMIN" ? user._id : user.adminId;
    if (!adminId)
      return NextResponse.json(
        { error: "Admin ID not found" },
        { status: 400 }
      );

    // Generate transaction ID
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const payment = new Payment({
      amount: parseFloat(requestData.amount),
      currency: requestData.currency || "USD",
      status: "PENDING",
      method: requestData.method || "CRYPTO",
      transactionId: transactionId,
      description: requestData.description || "Deposit",
      adminId: adminId,
      createdBy: session.user.id,
      network: requestData.network,
      walletAddress: requestData.walletAddress,
    });

    const savedPayment = await payment.save();

    const createdPayment = {
      ...savedPayment.toObject(),
      _id: savedPayment._id.toString(),
      id: savedPayment._id.toString(),
    };

    return NextResponse.json({ success: true, payment: createdPayment });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectMongoDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const query: { adminId?: ObjectId } = {};
    if (session.user.role === "ADMIN")
      query.adminId = new ObjectId(session.user.id);
    else if (session.user.role === "AGENT" && session.user.adminId)
      query.adminId = new ObjectId(session.user.adminId);

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(query),
    ]);

    const processedPayments = payments.map((payment) => ({
      ...payment,
      _id: String(payment._id),
      id: String(payment._id),
    }));

    return NextResponse.json({
      success: true,
      payments: processedPayments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
