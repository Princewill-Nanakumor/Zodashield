// src/lib/emailService.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface PaymentNotificationEmailData {
  paymentId: string;
  amount: number;
  currency: string;
  network: string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  transactionId: string;
  adminId?: string;
}

export async function sendPaymentConfirmationEmail(
  data: PaymentNotificationEmailData
) {
  try {
    const notificationEmail = process.env.NOTIFICATION_EMAIL;

    if (!notificationEmail) {
      throw new Error("NOTIFICATION_EMAIL environment variable not set");
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const paymentDetailsUrl = data.adminId
      ? `${baseUrl}/dashboard/admin-management/${data.adminId}?tab=payments&paymentId=${data.paymentId}`
      : `${baseUrl}/dashboard/payment-details/${data.paymentId}`;

    // Simple plain text email
    const textContent = `Payment Confirmation Required

Amount: ${data.amount} ${data.currency}
Network: ${data.network}
User: ${data.userFirstName} ${data.userLastName} (${data.userEmail})
Transaction ID: ${data.transactionId}
Date: ${new Date().toLocaleString()}

Please review this payment in the admin dashboard:
${paymentDetailsUrl}

ZodaShield Admin Team`;

    // Simple HTML email - minimal styling
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Payment Confirmation Required</title>
</head>
<body style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.4; color: #333;">
  <div style="max-width: 500px; margin: 0 auto; padding: 20px;">
    
    <h2 style="color: #333; margin-bottom: 20px;">Payment Confirmation Required</h2>
    
    <p>A new payment has been submitted and requires your review:</p>
    
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr>
        <td style="padding: 5px 0; font-weight: bold;">Amount:</td>
        <td style="padding: 5px 0;">${data.amount} ${data.currency}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; font-weight: bold;">Network:</td>
        <td style="padding: 5px 0;">${data.network}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; font-weight: bold;">User:</td>
        <td style="padding: 5px 0;">${data.userFirstName} ${data.userLastName}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; font-weight: bold;">Email:</td>
        <td style="padding: 5px 0;">${data.userEmail}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; font-weight: bold;">Transaction ID:</td>
        <td style="padding: 5px 0; font-family: monospace;">${data.transactionId}</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; font-weight: bold;">Date:</td>
        <td style="padding: 5px 0;">${new Date().toLocaleString()}</td>
      </tr>
    </table>
    
    <p>
      <a href="${paymentDetailsUrl}" style="color: #0066cc; text-decoration: none;">
        Review Payment in Admin Dashboard
      </a>
    </p>
    
    <p style="color: #666; font-size: 12px; margin-top: 30px;">
      ZodaShield Admin Team
    </p>
    
  </div>
</body>
</html>`;

    const result = await resend.emails.send({
      from: "ZodaShield <noreply@zodashield.com>",
      to: [notificationEmail],
      subject: `Payment Review Required - ${data.amount} ${data.currency}`,
      html: emailHtml,
      text: textContent,
    });

    console.log("✅ Payment confirmation email sent successfully:", result);
    return { success: true, result };
  } catch (error) {
    console.error("❌ Failed to send payment confirmation email:", error);
    return { success: false, error };
  }
}
