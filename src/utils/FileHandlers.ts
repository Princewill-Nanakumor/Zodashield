// src/utils/FileHandlers.ts
import * as XLSX from "xlsx";

const headerMappings = {
  name: [
    "name",
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
  email: [
    "email",
    "email address",
    "mail",
    "e-mail",
    "contact email",
    "customer email",
    "emailaddress",
    "Email",
    "EMAIL",
    "Email Address",
  ],
  phone: [
    "phone",
    "phone number",
    "Phone number",
    "Phone Number",
    "contact number",
    "mobile",
    "telephone",
    "tel",
    "contact phone",
    "Phone",
    "PHONE",
    "Mobile",
  ],
  source: [
    "company",
    "Source",
    "source",
    "organization",
    "organisation",
    "business name",
    "company name",
    "Company",
    "COMPANY",
  ],
  status: ["status", "lead status", "contact status", "Status", "STATUS"],
  country: ["country", "nation", "location", "Country", "COUNTRY"],
  comments: ["comments", "notes", "description", "Comments", "COMMENTS"],
} as const;

const DEFAULT_STATUS = "NEW" as const;
const REQUIRED_FIELDS = ["name", "email", "phone", "country"] as const;

type ContactField = keyof typeof headerMappings;
type ValidStatus =
  | "NEW"
  | "CONTACTED"
  | "IN_PROGRESS"
  | "QUALIFIED"
  | "LOST"
  | "WON";

interface LeadRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  source?: string;
  status: ValidStatus;
  country?: string;
}

interface ExcelRow {
  [key: string]: string | number | undefined;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, "");
}

function findMatchingHeader(
  headers: string[],
  field: ContactField
): string | undefined {
  const normalizedHeaders = headers.map(normalizeText);
  const possibleMatches = headerMappings[field].map(normalizeText);
  const headerIndex = normalizedHeaders.findIndex((header) =>
    possibleMatches.includes(header)
  );
  return headerIndex !== -1 ? headers[headerIndex] : undefined;
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  const firstName = parts[0];
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

const getHeaderRow = (worksheet: XLSX.WorkSheet): string[] => {
  const headers: string[] = [];
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
  const R = range.s.r;

  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: C })];
    const header = cell ? cell.v : "";
    headers.push(header ? String(header).trim() : "");
  }

  return headers;
};

const readExcelFile = async (file: File): Promise<XLSX.WorkBook> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        resolve(workbook);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const validateExcelFile = async (file: File): Promise<string[]> => {
  const missingFields: string[] = [];

  try {
    const workbook = await readExcelFile(file);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const headers = getHeaderRow(worksheet); // Using getHeaderRow instead of sheet_to_json

    console.log("Found headers:", headers);

    REQUIRED_FIELDS.forEach((field) => {
      const matchingHeader = findMatchingHeader(headers, field);
      if (!matchingHeader) {
        missingFields.push(field);
      }
    });

    return missingFields;
  } catch (error) {
    console.error("Error validating Excel file:", error);
    throw new Error("Invalid Excel file format");
  }
};

export const validateHeaders = (text: string) => {
  const lines = text.split("\n");
  if (lines.length === 0) {
    throw new Error("File is empty");
  }

  const headers = lines[0].split(",").map((header) => header.trim());

  const hasFullName = headers.some(
    (header) =>
      normalizeText(header) === normalizeText("Full Name") ||
      normalizeText(header) === normalizeText("Name")
  );

  const hasFirstAndLastName =
    headers.some(
      (header) => normalizeText(header) === normalizeText("First Name")
    ) &&
    headers.some(
      (header) => normalizeText(header) === normalizeText("Last Name")
    );

  const hasEmail = headers.some(
    (header) =>
      normalizeText(header) === normalizeText("Email") ||
      normalizeText(header) === normalizeText("Email Address")
  );

  const hasPhone = headers.some(
    (header) =>
      normalizeText(header) === normalizeText("Phone") ||
      normalizeText(header) === normalizeText("Phone Number") ||
      normalizeText(header) === normalizeText("Mobile")
  );

  const hasCountry = headers.some(
    (header) => normalizeText(header) === normalizeText("Country")
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
};

export function validateHeaderArray(headers: string[]): string[] {
  const missingFields: string[] = [];

  REQUIRED_FIELDS.forEach((field) => {
    const matchingHeader = findMatchingHeader(headers, field);
    if (!matchingHeader) {
      missingFields.push(field);
    }
  });

  return missingFields;
}
export const processExcelFile = async (file: File): Promise<LeadRequest[]> => {
  try {
    const workbook = await readExcelFile(file);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const headers = getHeaderRow(worksheet);
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      defval: "",
    }) as ExcelRow[];

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error("No data found in file");
    }

    // Print headers and first row keys for debugging
    console.log("Headers from Excel:", headers);
    console.log("First row keys:", Object.keys(rows[0]));

    const nameHeader = findMatchingHeader(headers, "name");
    const emailHeader = findMatchingHeader(headers, "email");
    const phoneHeader = findMatchingHeader(headers, "phone");
    let sourceHeader = findMatchingHeader(headers, "source");
    const statusHeader = findMatchingHeader(headers, "status");
    const countryHeader = findMatchingHeader(headers, "country");

    // If sourceHeader is the same as countryHeader, treat as missing
    if (sourceHeader && countryHeader && sourceHeader === countryHeader) {
      sourceHeader = undefined;
    }

    if (!nameHeader || !emailHeader || !countryHeader || !phoneHeader) {
      throw new Error("Required headers not found");
    }

    const validLeads: LeadRequest[] = [];
    for (const row of rows) {
      // Debugging logs
      console.log("Row:", row);
      console.log(
        "sourceHeader:",
        sourceHeader,
        "countryHeader:",
        countryHeader
      );
      console.log(
        "row[sourceHeader]:",
        sourceHeader ? row[sourceHeader] : undefined
      );
      console.log(
        "row[countryHeader]:",
        countryHeader ? row[countryHeader] : undefined
      );

      const fullName = String(row[nameHeader] || "").trim();
      const email = String(row[emailHeader] || "").trim();
      const phone = phoneHeader
        ? String(row[phoneHeader] || "").trim()
        : undefined;

      // Only use source if header exists in both headers and row, and is not country
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

      const country =
        countryHeader && row[countryHeader]
          ? String(row[countryHeader]).trim()
          : undefined;
      const rawStatus = statusHeader
        ? String(row[statusHeader] || "").toUpperCase()
        : DEFAULT_STATUS;

      if (!fullName || !email || !isValidEmail(email)) {
        continue;
      }

      const { firstName, lastName } = splitName(fullName);
      const status = rawStatus as ValidStatus;

      validLeads.push({
        firstName,
        lastName,
        email,
        phone,
        source,
        status: status || DEFAULT_STATUS,
        country,
      });
    }

    if (validLeads.length === 0) {
      throw new Error("No valid leads found in file");
    }

    return validLeads;
  } catch (error) {
    console.error("Error processing Excel file:", error);
    throw error;
  }
};
export async function processTextData(text: string): Promise<LeadRequest[]> {
  const lines = text.split("\n");
  if (lines.length < 2) {
    throw new Error("File must contain headers and at least one data row");
  }

  const headers = lines[0].split(",").map((h) => h.trim());
  const { missingFields } = validateHeaders(text);

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
  }

  const validLeads: LeadRequest[] = [];

  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;

    const values = line.split(",").map((v) => v.trim());
    const row = headers.reduce((obj, header, index) => {
      obj[header] = values[index] || "";
      return obj;
    }, {} as ExcelRow);

    const nameHeader = findMatchingHeader(headers, "name");
    const emailHeader = findMatchingHeader(headers, "email");
    const phoneHeader = findMatchingHeader(headers, "phone");
    const countryHeader = findMatchingHeader(headers, "country");

    if (!nameHeader || !emailHeader || !phoneHeader || !countryHeader) continue;

    const fullName = String(row[nameHeader] || "");
    const email = String(row[emailHeader] || "");
    const phone = String(row[phoneHeader] || "");
    const country = String(row[countryHeader] || "");

    if (!fullName || !email || !isValidEmail(email)) continue;

    const { firstName, lastName } = splitName(fullName);

    validLeads.push({
      firstName,
      lastName,
      email,
      phone,
      status: DEFAULT_STATUS,
      country,
    });
  }

  if (validLeads.length === 0) {
    throw new Error("No valid leads found in file");
  }

  return validLeads;
}

export type { LeadRequest };
