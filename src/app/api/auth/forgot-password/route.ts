import { NextResponse } from "next/server";
import { connectMongoDB } from "@/libs/dbConfig";
import User from "@/models/User";
import { Resend } from "resend";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const createPasswordResetEmail = (firstName: string, resetUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <header style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #1a365d;">Reset Your Password</h1>
    </header>
    
    <main>
      <p>Hello ${firstName},</p>
      
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 4px; display: inline-block;">
          Reset Password
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        This link will expire in 1 hour for security reasons.
      </p>
      
      <p style="color: #666; font-size: 14px;">
        If you didn't request this password reset, please ignore this email or contact support if you have concerns.
      </p>
      
      <p style="color: #666; font-size: 14px;">
        If the button doesn't work, copy and paste this link into your browser:
        <br>
        <a href="${resetUrl}">${resetUrl}</a>
      </p>
    </main>
    
    <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
      <p>© ${new Date().getFullYear()} Horizon. All rights reserved.</p>
      <p>This is a system-generated email. Please do not reply to this message.</p>
    </footer>
  </div>
</body>
</html>
`;

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await connectMongoDB();
    const user = await User.findOne({ email: email });

    if (user) {
      try {
        const resetToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto
          .createHash("sha256")
          .update(resetToken)
          .digest("hex");

        // Update user with reset token
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();

        const resetUrl = `${APP_URL}/reset-password/${resetToken}`;
        console.log("Reset URL generated:", resetUrl);

        const emailResult = await resend.emails.send({
          from: "CRM <onboarding@resend.dev>",
          to: email,
          subject: "Reset Your Password - Horizon",
          html: createPasswordResetEmail(user.firstName, resetUrl),
          replyTo: "onboarding@resend.dev",
          tags: [
            {
              name: "category",
              value: "password_reset",
            },
          ],
        });

        console.log("Reset email sent successfully:", emailResult);
      } catch (emailError) {
        console.error("Failed to send reset email:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "If an account exists with this email, you will receive a password reset link shortly.",
    });
  } catch (error) {
    console.error("Password reset request failed:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to process your request at this time. Please try again later.",
      },
      { status: 500 }
    );
  }
}
