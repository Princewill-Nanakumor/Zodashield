// src/lib/notificationService.ts
export async function createPaymentNotification(
  type: "PAYMENT_APPROVED" | "PAYMENT_REJECTED",
  paymentId: string,
  amount: number,
  currency: string,
  userId: string
) {
  try {
    const message =
      type === "PAYMENT_APPROVED"
        ? `Your payment of ${amount} ${currency} has been approved Successfully`
        : `Your payment of ${amount} ${currency} has been rejected.`;

    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        message,
        role: "ADMIN",
        link: `/dashboard/billing/payments/${paymentId}`,
        paymentId,
        amount,
        currency,
        userId,
      }),
    });
  } catch (error) {
    console.error("Error creating payment notification:", error);
  }
}
