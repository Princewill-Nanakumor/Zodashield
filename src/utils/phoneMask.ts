/**
 * Masks a phone number, showing only the last 4 digits
 * Example: +1234567890 -> *******7890
 * Example: 1234567890 -> ******7890
 */
export function maskPhoneNumber(phone: string | null | undefined): string {
  if (!phone || phone.trim() === "") {
    return "Not provided";
  }

  // Remove all spaces and formatting for consistent masking
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");

  // If the number is 4 digits or less, show all asterisks
  if (cleaned.length <= 4) {
    return "*".repeat(cleaned.length);
  }

  // Show last 4 digits, mask the rest with asterisks
  const last4 = cleaned.slice(-4);
  const maskedLength = cleaned.length - 4;
  const masked = "*".repeat(maskedLength);

  return `${masked}${last4}`;
}

