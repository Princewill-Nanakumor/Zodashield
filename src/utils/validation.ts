// src/utils/validation.ts
import { ValidStatus, VALID_STATUSES } from "@/constants/headMappings";

// Enhanced validation with better error messages
const REQUIRED_HEADERS = ["email", "name", "country", "phone"];
const OPTIONAL_HEADERS = ["source", "comments"];
const HEADER_ALIASES = {
  email: [
    "email",
    "Email",
    "Emails",
    "e-mail",
    "e mail",
    "email address",
    "emails, Email Address",
  ],
  name: [
    "name",
    "names",
    "Names",
    "full name",
    "Full name",
    "Full Name",
    "contact name",
    "customer name",
    "client name",
    "firstname",
    "first name",
    "lastname",
    "last name",
    "surname",
    "Name",
    "NAME",
    "First Name",
    "Last Name",
    "FIRST NAME",
    "LAST NAME",
  ],
  phone: [
    "phone",
    "phone number",
    "telephone",
    "tel",
    "mobile",
    "cell",
    "Phone",
    "Phone No",
    "Phone no",
    "Phone Number",
  ],
  country: ["country", "nation", "location", "Country"],
  source: ["source", "origin", "referral", "Source"],
  comments: ["comments", "comment", "notes", "note", "description"],
};

export interface ValidationHeaders {
  missingFields: string[];
  foundHeaders: string[];
  suggestions: string[];
  errorMessage: string;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function isValidStatus(status: string): status is ValidStatus {
  return VALID_STATUSES.includes(status as ValidStatus);
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length >= 10 && cleaned.length <= 15;
}

export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, "");
}

export function validateHeaders(headers: string[]): ValidationHeaders {
  console.log("Validating headers:", headers);

  const missingFields: string[] = [];
  const foundHeaders: string[] = [];
  const suggestions: string[] = [];

  // Check required headers
  for (const required of REQUIRED_HEADERS) {
    const hasHeader = headers.some(
      (header) =>
        HEADER_ALIASES[required as keyof typeof HEADER_ALIASES]?.some(
          (alias) => header.toLowerCase() === alias.toLowerCase()
        ) || header.toLowerCase() === required.toLowerCase()
    );

    if (!hasHeader) {
      missingFields.push(required);
      suggestions.push(
        ...(HEADER_ALIASES[required as keyof typeof HEADER_ALIASES] || [
          required,
        ])
      );
    } else {
      foundHeaders.push(required);
    }
  }

  // Check optional headers for better suggestions
  for (const optional of OPTIONAL_HEADERS) {
    const hasHeader = headers.some(
      (header) =>
        HEADER_ALIASES[optional as keyof typeof HEADER_ALIASES]?.some(
          (alias) => header.toLowerCase() === alias.toLowerCase()
        ) || header.toLowerCase() === optional.toLowerCase()
    );

    if (hasHeader) {
      foundHeaders.push(optional);
    }
  }

  // Generate helpful error message
  let errorMessage = "";
  if (missingFields.length > 0) {
    errorMessage = `Missing required headers: ${missingFields.join(", ")}.\n\n`;
    errorMessage += `Headers found in your file: ${headers.join(", ")}\n\n`;
    errorMessage += `Please add these headers to your file:\n`;
    missingFields.forEach((field) => {
      const aliases = HEADER_ALIASES[field as keyof typeof HEADER_ALIASES];
      if (aliases) {
        errorMessage += `- ${field} (or: ${aliases.join(", ")})\n`;
      } else {
        errorMessage += `- ${field}\n`;
      }
    });
  }

  return {
    missingFields,
    foundHeaders,
    suggestions: [...new Set(suggestions)], // Remove duplicates
    errorMessage,
  };
}

export const findMatchingHeader = (
  headers: string[],
  target: string
): string | null => {
  const aliases = HEADER_ALIASES[target as keyof typeof HEADER_ALIASES] || [
    target,
  ];

  for (const alias of aliases) {
    const found = headers.find(
      (header) => header.toLowerCase() === alias.toLowerCase()
    );
    if (found) return found;
  }

  return null;
};

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
