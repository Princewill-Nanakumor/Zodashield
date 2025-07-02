// src/utils/validators.ts

import { REQUIRED_FIELDS } from "./types";
import {
  readExcelFile,
  getHeaderRow,
  normalizeText,
  findMatchingHeader,
} from "./helper";

export const validateExcelFile = async (
  file: File
): Promise<{ missingFields: string[] }> => {
  const missingFields: string[] = [];

  try {
    const workbook = await readExcelFile(file);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const headers = getHeaderRow(worksheet);

    console.log("Found headers:", headers);

    REQUIRED_FIELDS.forEach((field) => {
      const matchingHeader = findMatchingHeader(headers, field);
      if (!matchingHeader) {
        missingFields.push(field);
      }
    });

    return { missingFields };
  } catch (error) {
    console.error("Error validating Excel file:", error);
    throw new Error("Invalid Excel file format");
  }
};

export function validateHeaders(headers: string[]): {
  missingFields: string[];
} {
  const normalizedHeaders = headers.map((header) => normalizeText(header));

  const hasFullName = normalizedHeaders.some(
    (header) =>
      header === normalizeText("Full Name") || header === normalizeText("Name")
  );

  const hasFirstName = normalizedHeaders.some(
    (header) =>
      header === normalizeText("First Name") ||
      header === normalizeText("Firstname") ||
      header === normalizeText("Given Name")
  );

  const hasLastName = normalizedHeaders.some(
    (header) =>
      header === normalizeText("Last Name") ||
      header === normalizeText("Lastname") ||
      header === normalizeText("Surname") ||
      header === normalizeText("Family Name")
  );
  const hasFirstAndLastName = hasFirstName && hasLastName;

  const hasEmail = normalizedHeaders.some(
    (header) =>
      header === normalizeText("Email") ||
      header === normalizeText("Email Address") ||
      header === normalizeText("Emails")
  );

  const hasPhone = normalizedHeaders.some(
    (header) =>
      header === normalizeText("Phone") ||
      header === normalizeText("Phone Number") ||
      header === normalizeText("Mobile") ||
      header === normalizeText("Cell")
  );

  const hasCountry = normalizedHeaders.some(
    (header) => header === normalizeText("Country")
  );

  const missingFields: string[] = [];

  if (!hasFullName && !hasFirstAndLastName) {
    missingFields.push("Name (Full Name or First Name + Last Name)");
  }
  if (!hasEmail) {
    missingFields.push("Email");
  }
  if (!hasPhone) {
    missingFields.push("Phone Number");
  }
  if (!hasCountry) {
    missingFields.push("Country");
  }

  return { missingFields };
}

export function validateHeaderArray(headers: string[]): {
  missingFields: string[];
} {
  const missingFields: string[] = [];

  REQUIRED_FIELDS.forEach((field) => {
    const matchingHeader = findMatchingHeader(headers, field);
    if (!matchingHeader) {
      missingFields.push(field);
    }
  });

  return { missingFields };
}
