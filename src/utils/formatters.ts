// src/utils/formatters.ts
export function formatPhoneNumber(phone: string): string {
  if (!phone) return "";

  // Handle Excel scientific notation
  if (phone.includes("E+") || phone.includes("e+")) {
    const [mantissa, exponent] = phone.toLowerCase().split("e+");
    const decimalPlaces = (mantissa.split(".")[1] || "").length;
    const zeros = parseInt(exponent) - decimalPlaces;
    return mantissa.replace(".", "") + "0".repeat(zeros);
  }

  const cleaned = phone
    .toString()
    .trim()
    .replace(/[^\d+]/g, "");

  // Handle UK numbers
  if (cleaned.match(/^(\+?447|07)\d{9}$/)) {
    return cleaned.startsWith("+")
      ? cleaned
      : cleaned.startsWith("07")
      ? "+44" + cleaned.substring(1)
      : cleaned.startsWith("447")
      ? "+" + cleaned
      : cleaned;
  }

  return cleaned;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
