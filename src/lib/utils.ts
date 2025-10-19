import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats time string to ensure 24-hour format display
 * @param timeString - Time string in HH:mm format
 * @returns Formatted time string in 24-hour format
 */
export function formatTime24Hour(timeString: string): string {
  if (!timeString) return "";

  // Ensure the time is in HH:mm format
  const [hours, minutes] = timeString.split(":");
  if (!hours || !minutes) return timeString;

  // Format with leading zeros
  const formattedHours = hours.padStart(2, "0");
  const formattedMinutes = minutes.padStart(2, "0");

  return `${formattedHours}:${formattedMinutes}`;
}
