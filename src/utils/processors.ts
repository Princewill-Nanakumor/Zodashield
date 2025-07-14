import * as XLSX from "xlsx";
import { LeadRequest } from "./types";
import {
  readExcelFile,
  getHeaderRow,
  findMatchingHeader,
  isValidEmail,
  splitName,
} from "./helper";
import { validateHeaders } from "./validation";

const DEFAULT_STATUS = "NEW";

export const processExcelFile = async (file: File): Promise<LeadRequest[]> => {
  try {
    const workbook = await readExcelFile(file);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const headers: string[] = getHeaderRow(worksheet);

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: "",
    }) as Record<string, string>[];

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error("No data found in file");
    }

    // Enhanced validation with detailed error messages
    const { missingFields, foundHeaders, errorMessage } =
      validateHeaders(headers);
    if (missingFields.length > 0) {
      throw {
        type: "MISSING_HEADERS",
        missingFields: missingFields,
        foundHeaders: foundHeaders,
        errorMessage: errorMessage,
        message: "Missing required headers",
      };
    }

    // Use enhanced header matching
    const nameHeader = findMatchingHeader(headers, "name");
    const firstNameHeader = findMatchingHeader(headers, "first name");
    const lastNameHeader = findMatchingHeader(headers, "last name");
    const emailHeader = findMatchingHeader(headers, "email");
    const phoneHeader = findMatchingHeader(headers, "phone");
    let sourceHeader = findMatchingHeader(headers, "source");
    const commentsHeader = findMatchingHeader(headers, "comments");
    const countryHeader = findMatchingHeader(headers, "country");

    // If sourceHeader is the same as countryHeader, treat as missing
    if (sourceHeader && countryHeader && sourceHeader === countryHeader) {
      sourceHeader = undefined;
    }

    const validLeads: LeadRequest[] = [];
    for (const row of rows) {
      // Use "Name" or "Full Name" if available, else combine "First Name" + "Last Name"
      let fullName = "";
      if (nameHeader) {
        fullName = String(row[nameHeader] || "").trim();
      } else if (firstNameHeader && lastNameHeader) {
        fullName =
          String(row[firstNameHeader] || "").trim() +
          " " +
          String(row[lastNameHeader] || "").trim();
      }

      const email = emailHeader ? String(row[emailHeader] || "").trim() : "";
      const phone = phoneHeader ? String(row[phoneHeader] || "").trim() : "";

      // Only use source if header exists and is not country
      let source = "-";
      if (
        sourceHeader &&
        sourceHeader !== countryHeader &&
        headers.includes(sourceHeader) &&
        Object.prototype.hasOwnProperty.call(row, sourceHeader) &&
        String(row[sourceHeader]).trim() !== ""
      ) {
        source = String(row[sourceHeader]).trim();
      }

      const comments = commentsHeader
        ? String(row[commentsHeader] || "").trim() || "No comments yet"
        : "No comments yet";
      const country = countryHeader
        ? String(row[countryHeader] || "").trim()
        : "";

      if (!fullName || !email || !isValidEmail(email)) {
        continue;
      }

      const { firstName, lastName } = splitName(fullName);

      validLeads.push({
        firstName,
        lastName,
        email,
        phone,
        source,
        comments,
        status: DEFAULT_STATUS,
        country,
      });
    }

    if (validLeads.length === 0) {
      throw {
        type: "NO_VALID_LEADS",
        message:
          "No valid leads found in file. Please ensure your file contains valid email addresses and names.",
      };
    }

    return validLeads;
  } catch (error) {
    // Always throw the error as-is to preserve custom properties
    throw error;
  }
};

export const processTextData = async (text: string): Promise<LeadRequest[]> => {
  try {
    // Split by both newlines and tabs to handle various formats
    const lines = text.split(/[\n\r]+/).filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error("Data must contain headers and at least one data row");
    }

    // Try to detect the delimiter (tab or comma)
    const firstLine = lines[0];
    const delimiter = firstLine.includes("\t") ? "\t" : ",";

    const headers = firstLine.split(delimiter).map((h) => h.trim());

    // Enhanced validation with detailed error messages
    const { missingFields, foundHeaders, errorMessage } =
      validateHeaders(headers);
    if (missingFields.length > 0) {
      throw {
        type: "MISSING_HEADERS",
        missingFields: missingFields,
        foundHeaders: foundHeaders,
        errorMessage: errorMessage,
        message: "Missing required headers",
      };
    }

    // Use enhanced header matching
    const nameHeader = findMatchingHeader(headers, "name");
    const firstNameHeader = findMatchingHeader(headers, "first name");
    const lastNameHeader = findMatchingHeader(headers, "last name");
    const emailHeader = findMatchingHeader(headers, "email");
    const phoneHeader = findMatchingHeader(headers, "phone");
    let sourceHeader = findMatchingHeader(headers, "source");
    const commentsHeader = findMatchingHeader(headers, "comments");
    const countryHeader = findMatchingHeader(headers, "country");

    // If sourceHeader is the same as countryHeader, treat as missing
    if (sourceHeader && countryHeader && sourceHeader === countryHeader) {
      sourceHeader = undefined;
    }

    const validLeads: LeadRequest[] = [];

    for (const line of lines.slice(1)) {
      if (!line.trim()) continue;

      const values = line.split(delimiter).map((v) => v.trim());

      // Use "Name" or "Full Name" if available, else combine "First Name" + "Last Name"
      let fullName = "";
      if (nameHeader) {
        fullName = values[headers.indexOf(nameHeader)] || "";
      } else if (firstNameHeader && lastNameHeader) {
        fullName =
          (values[headers.indexOf(firstNameHeader)] || "") +
          " " +
          (values[headers.indexOf(lastNameHeader)] || "");
      }

      const email = emailHeader
        ? values[headers.indexOf(emailHeader)] || ""
        : "";
      const phone = phoneHeader
        ? values[headers.indexOf(phoneHeader)] || ""
        : "";

      // Only use source if header exists and is not country
      let source = "-";
      if (
        sourceHeader &&
        sourceHeader !== countryHeader &&
        headers.includes(sourceHeader) &&
        values[headers.indexOf(sourceHeader)] &&
        values[headers.indexOf(sourceHeader)].trim() !== ""
      ) {
        source = values[headers.indexOf(sourceHeader)].trim();
      }

      const comments = commentsHeader
        ? values[headers.indexOf(commentsHeader)] || "No comments yet"
        : "No comments yet";
      const country = countryHeader
        ? values[headers.indexOf(countryHeader)] || ""
        : "";

      if (!fullName.trim() || !email.trim() || !isValidEmail(email)) continue;

      const { firstName, lastName } = splitName(fullName);

      validLeads.push({
        firstName,
        lastName,
        email,
        phone,
        source,
        comments,
        status: DEFAULT_STATUS,
        country,
      });
    }

    if (validLeads.length === 0) {
      throw {
        type: "NO_VALID_LEADS",
        message:
          "No valid leads found in data. Please ensure your data contains valid email addresses and names.",
      };
    }
    return validLeads;
  } catch (error) {
    throw error;
  }
};
