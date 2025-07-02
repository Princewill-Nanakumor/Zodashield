// src/utils/validation.ts
import { ValidStatus, VALID_STATUSES } from "@/constants/headMappings";

export interface ValidationHeaders {
  missingFields: string[];
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function isValidStatus(status: string): status is ValidStatus {
  return VALID_STATUSES.includes(status as ValidStatus);
}

export function isValidPhone(phone: string): boolean {
  // Basic phone validation - can be enhanced based on requirements
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length >= 10 && cleaned.length <= 15;
}

export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, "");
}
export function validateHeaders(headers: string[]): ValidationHeaders {
  const requiredFields = ["name", "email", "phone", "country"];
  const missingFields = requiredFields.filter(
    (field) =>
      !headers.some((header) =>
        header.toLowerCase().includes(field.toLowerCase())
      )
  );
  return { missingFields };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateContact(contact: {
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
}): ValidationResult {
  const errors: string[] = [];

  if (!contact.name || contact.name.trim().length < 2) {
    errors.push("Name is required and must be at least 2 characters");
  }

  if (!contact.email || !isValidEmail(contact.email)) {
    errors.push("Valid email is required");
  }

  if (contact.phone && !isValidPhone(contact.phone)) {
    errors.push("Invalid phone number format");
  }

  if (contact.status && !isValidStatus(contact.status)) {
    errors.push(`Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
