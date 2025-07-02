// src/app/api/contacts/route.ts

import { NextResponse } from "next/server";
import { executeDbOperation } from "@/libs/dbConfig";
import Contact from "@/models/contact";
import { MongoServerError } from "mongodb";
import * as XLSX from "xlsx";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ["CREATE", "UPDATE", "DELETE", "IMPORT"],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  details: {
    type: String,
    required: true,
  },
  metadata: {
    type: Object,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Activity =
  mongoose.models.Activity || mongoose.model("Activity", activitySchema);

type MetadataValue = string | number | boolean | null | undefined;

interface ActivityLog {
  type: "CREATE" | "UPDATE" | "DELETE" | "IMPORT";
  userId: string;
  details: string;
  metadata?: {
    contactId?: string;
    email?: string;
    count?: number;
    source?: string;
    successCount?: number;
    failureCount?: number;
    changes?: Array<{
      field: string;
      oldValue: string | null;
      newValue: string;
    }>;
    [key: string]:
      | MetadataValue
      | Array<{
          field: string;
          oldValue: string | null;
          newValue: string;
        }>
      | undefined;
  };
}

interface HeaderMapping {
  [key: number]: string;
  nameColumns: number[];
}
interface Contact {
  name: string;
  email: string;
  phone?: string;
  country?: string;
  source: string;
  status?: string;
  comments?: string;
  company?: string;
}

interface ContactRequest {
  name: string;
  email: string;
  phone?: string;
  source: string;
  company?: string;
  status?: "New" | "Contacted" | "In Progress" | "Qualified" | "Lost" | "Won";
  country?: string;
  comments?: string;
}

const VALID_STATUSES = [
  "New",
  "Contacted",
  "In Progress",
  "Qualified",
  "Lost",
  "Won",
] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

const headerMappings: Record<string, string[]> = {
  name: [
    "name",
    "full name",
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
    "Email address",
    "Emails",
    "EMAILS",
  ],
  phone: [
    "phone",
    "phone no",
    "Phone no",
    "phone number",
    "contact number",
    "mobile",
    "telephone",
    "tel",
    "contact phone",
    "phonenumber",
    "Phone",
    "PHONE",
  ],
  source: ["source", "Source"],
  status: [
    "status",
    "lead status",
    "contact status",
    "stage",
    "Status",
    "STATUS",
  ],
  country: [
    "country",
    "nation",
    "location",
    "Country",
    "Countries",
    "countries",
    "COUNTRY",
    "Country Name",
    "country name",
  ],
  comments: [
    "comments",
    "comment",
    "notes",
    "note",
    "description",
    "Comments",
    "COMMENTS",
    "Notes",
    "NOTES",
  ],
};

function normalizeHeader(header: string): string | null {
  if (!header) return null;
  const lowercaseHeader = header.toLowerCase().trim();
  console.log("Normalizing header:", header, "→", lowercaseHeader);

  for (const [standardField, variations] of Object.entries(headerMappings)) {
    if (variations.map((v) => v.toLowerCase()).includes(lowercaseHeader)) {
      console.log("Matched header:", lowercaseHeader, "→", standardField);
      return standardField;
    }
  }
  console.log("No match found for header:", lowercaseHeader);
  return null;
}

function isValidStatus(value: string): value is ValidStatus {
  return VALID_STATUSES.includes(value as ValidStatus);
}

async function processTextData(text: string): Promise<ContactRequest[]> {
  try {
    const rows = text.split("\n").map((row) => row.split("\t"));
    if (rows.length < 2) {
      throw new Error("Not enough data rows");
    }

    const headers = rows[0].map((header) => normalizeHeader(header.trim()));
    const contacts: ContactRequest[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const contact: Partial<ContactRequest> = {};
      let hasNameAndEmail = false;

      row.forEach((value, index) => {
        const header = headers[index];
        value = value.trim();

        if (value) {
          if (!header && value.includes("@")) {
            contact.email = value.toLowerCase();
            if (contact.name) hasNameAndEmail = true;
          } else if (!header && value.match(/^[A-Za-z\s]+$/)) {
            contact.name = value;
            if (contact.email) hasNameAndEmail = true;
          } else if (header) {
            if (header === "name" || header === "email") {
              contact[header] =
                header === "email" ? value.toLowerCase() : value;
              if (contact.name && contact.email) hasNameAndEmail = true;
            } else if (header === "status" && isValidStatus(value)) {
              contact.status = value;
            } else if (header === "phone" || header === "source") {
              contact[header] = value;
            }
          }
        }
      });

      if (hasNameAndEmail) {
        contacts.push({
          name: contact.name!,
          email: contact.email!,
          ...(contact.phone && { phone: contact.phone }),
          status: contact.status || "New",
          source: "paste",
        });
      }
    }

    return contacts;
  } catch (error) {
    console.error("Error processing text data:", error);
    throw error;
  }
}

async function processExcelData(file: ArrayBuffer): Promise<ContactRequest[]> {
  try {
    console.log("Starting Excel processing");
    const workbook = XLSX.read(file, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
      defval: "",
      blankrows: false,
    }) as Array<Array<string>>;

    if (jsonData.length < 2) throw new Error("Not enough data rows");

    const headers = jsonData[0].filter(Boolean).map((header) => header.trim());
    console.log("Headers found:", headers);

    // Initialize contacts array first
    const contacts: ContactRequest[] = [];

    // HEAD MAPPER

    const headerMap = headers.reduce<HeaderMapping>(
      (acc, header, index: number) => {
        if (!acc.nameColumns) {
          acc.nameColumns = [];
        }

        const normalizedHeader =
          header?.toLowerCase().replace(/\s+/g, "").trim() || "";

        // Check first few rows for data patterns first
        let foundPattern = false;
        for (let i = 1; i < Math.min(6, jsonData.length); i++) {
          const rowData = jsonData[i];
          if (!rowData) continue;

          const value = rowData[index]?.toString().trim();
          if (!value) continue;

          if (value.includes("@")) {
            acc[index] = "email";
            console.log(
              `Detected email column at index ${index} from data pattern`
            );
            foundPattern = true;
            break;
          } else if (value.match(/^\+?[\d\s-]{8,}$/)) {
            acc[index] = "phone";
            foundPattern = true;
            break;
          } else if (
            [
              "Australia",
              "Sweden",
              "Norway",
              "Denmark",
              "Netherlands",
            ].includes(value)
          ) {
            acc[index] = "country";
            foundPattern = true;
            break;
          }
        }

        // If no pattern found, try header names
        if (!foundPattern) {
          if (
            (normalizedHeader.includes("first") ||
              normalizedHeader.includes("last") ||
              normalizedHeader.includes("name")) &&
            index > 0 && // Skip first column (usually ID)
            !normalizedHeader.includes("file") &&
            !normalizedHeader.includes("id")
          ) {
            acc.nameColumns.push(index);
            acc[index] = "name";
            console.log(`Mapped name column at index ${index}`);
          } else if (
            normalizedHeader.includes("email") ||
            normalizedHeader.includes("mail") ||
            normalizedHeader.includes("e-mail")
          ) {
            acc[index] = "email";
          } else if (
            normalizedHeader.includes("phone") ||
            normalizedHeader.includes("mobile") ||
            normalizedHeader.includes("tel")
          ) {
            acc[index] = "phone";
          } else if (
            normalizedHeader.includes("country") ||
            normalizedHeader.includes("nation")
          ) {
            acc[index] = "country";
          } else if (
            normalizedHeader.includes("comment") ||
            normalizedHeader.includes("note")
          ) {
            acc[index] = "comments";
          }
        }

        return acc;
      },
      { nameColumns: [] }
    );

    // When processing rows
    // At the start of processing, create a Set to track unique emails
    const existingEmails = new Set<string>();

    // When processing rows
    for (let i = 1; i < jsonData.length; i++) {
      const rowData = jsonData[i];
      if (!rowData || rowData.length === 0) continue;

      const currentContact: Partial<ContactRequest> = {};

      // Get name from specifically mapped name columns only
      if (headerMap.nameColumns.length > 0) {
        const names = headerMap.nameColumns
          .map((index) => rowData[index]?.toString().trim())
          .filter(Boolean);
        currentContact.name = names.join(" ").trim();
      } else {
        // Fallback: look for name in columns 1 and 2 (typical name position)
        const possibleName = [rowData[1], rowData[2]]
          .map((val) => val?.toString().trim())
          .filter(Boolean)
          .join(" ")
          .trim();
        if (
          possibleName &&
          !possibleName.includes("@") &&
          !possibleName.match(/^\+?[\d\s-]{8,}$/)
        ) {
          currentContact.name = possibleName;
        }
      }

      // Look for email in all columns
      rowData.forEach((value) => {
        const strValue = value?.toString().trim() || "";
        if (strValue.includes("@")) {
          currentContact.email = strValue.toLowerCase(); // Ensure email is lowercase for consistent comparison
        }
      });

      // Process other fields
      Object.entries(headerMap).forEach(([indexStr, field]) => {
        if (field === "name") return;

        const index = parseInt(indexStr);
        if (isNaN(index)) return;

        const value = rowData[index]?.toString().trim();
        if (!value) return;

        switch (field) {
          case "phone":
            currentContact.phone = value;
            break;
          case "country":
            currentContact.country = value;
            break;
          case "comments":
            currentContact.comments = value;
            break;
        }
      });

      // Check for valid contact and duplicates
      if (currentContact.name && currentContact.email) {
        // Skip if this email already exists
        if (existingEmails.has(currentContact.email)) {
          console.log(`Skipping duplicate email: ${currentContact.email}`);
          continue;
        }

        // Add email to tracking set
        existingEmails.add(currentContact.email);

        // Add contact to list
        contacts.push({
          name: currentContact.name,
          email: currentContact.email,
          phone: currentContact.phone || "",
          country: currentContact.country || "",
          status: "New",
          comments: currentContact.comments || "",
          source: "",
        });
      }
    }

    // Add summary of duplicates found
    console.log(`Total rows processed: ${jsonData.length - 1}`);
    console.log(`Unique contacts added: ${contacts.length}`);
    console.log(`Duplicates skipped: ${jsonData.length - 1 - contacts.length}`);

    // At the start of processing, create a Set to track unique emails

    let duplicateCount = 0;
    let processedCount = 0;
    let skippedCount = 0;

    // When processing rows
    for (let i = 1; i < jsonData.length; i++) {
      const rowData = jsonData[i];
      if (!rowData || rowData.length === 0) {
        skippedCount++;
        continue;
      }

      processedCount++;
      const currentContact: Partial<ContactRequest> = {};

      // Get name from specifically mapped name columns
      if (headerMap.nameColumns.length > 0) {
        const names = headerMap.nameColumns
          .map((index) => rowData[index]?.toString().trim())
          .filter(Boolean);
        currentContact.name = names.join(" ").trim();
      } else {
        // Fallback: look for name in columns 1 and 2
        const possibleName = [rowData[1], rowData[2]]
          .map((val) => val?.toString().trim())
          .filter(Boolean)
          .join(" ")
          .trim();
        if (
          possibleName &&
          !possibleName.includes("@") &&
          !possibleName.match(/^\+?[\d\s-]{8,}$/)
        ) {
          currentContact.name = possibleName;
        }
      }

      // Look for email in all columns
      rowData.forEach((value) => {
        const strValue = value?.toString().trim() || "";
        if (strValue.includes("@")) {
          currentContact.email = strValue.toLowerCase(); // Ensure email is lowercase
        }
      });

      // Process other fields
      Object.entries(headerMap).forEach(([indexStr, field]) => {
        if (field === "name") return;

        const index = parseInt(indexStr);
        if (isNaN(index)) return;

        const value = rowData[index]?.toString().trim();
        if (!value) return;

        switch (field) {
          case "phone":
            currentContact.phone = value;
            break;
          case "country":
            currentContact.country = value;
            break;
          case "comments":
            currentContact.comments = value;
            break;
        }
      });

      // Check for valid contact and duplicates
      if (currentContact.name && currentContact.email) {
        // Skip if this email already exists
        if (existingEmails.has(currentContact.email)) {
          console.log(
            `Skipping duplicate email at row ${i}: ${currentContact.email}`
          );
          duplicateCount++;
          continue;
        }

        // Add email to tracking set
        existingEmails.add(currentContact.email);

        // Add contact to list
        contacts.push({
          name: currentContact.name,
          email: currentContact.email,
          phone: currentContact.phone || "",
          country: currentContact.country || "",
          status: "New",
          comments: currentContact.comments || "",
          source: "",
        });
      } else {
        skippedCount++;
      }
    }

    // Add detailed summary
    console.log("Processing Summary:");
    console.log(`Total rows in file: ${jsonData.length - 1}`);
    console.log(`Processed rows: ${processedCount}`);
    console.log(`Skipped rows (invalid/empty): ${skippedCount}`);
    console.log(`Duplicate emails found: ${duplicateCount}`);
    console.log(`Valid unique contacts added: ${contacts.length}`);
    console.log(`Existing emails in set: ${existingEmails.size}`);

    // Throw error if numbers don't match expectations
    if (contacts.length > jsonData.length - 1) {
      throw new Error(
        `Invalid contact count: ${contacts.length} contacts created from ${
          jsonData.length - 1
        } rows`
      );
    }

    // When processing rows
    for (let i = 1; i < jsonData.length; i++) {
      const rowData = jsonData[i];
      const currentContact: Partial<ContactRequest> = {};

      // Debug log for each row
      console.log(`Processing row ${i}:`, rowData);

      // Combine name fields
      const names = headerMap.nameColumns
        .map((index) => rowData[index]?.toString().trim())
        .filter(Boolean);
      currentContact.name = names.join(" ").trim();

      // Look for email in all columns
      rowData.forEach((value, index) => {
        const strValue = value?.toString().trim() || "";
        if (strValue.includes("@")) {
          currentContact.email = strValue.toLowerCase();
          console.log(`Found email in column ${index}: ${strValue}`);
        }
      });

      // Process other fields
      Object.entries(headerMap).forEach(([indexStr, field]) => {
        if (field === "name") return;

        const index = parseInt(indexStr);
        if (isNaN(index)) return;

        const value = rowData[index]?.toString().trim();
        if (!value) return;

        switch (field) {
          case "phone":
            currentContact.phone = value;
            break;
          case "country":
            currentContact.country = value;
            break;
          case "comments":
            currentContact.comments = value;
            break;
        }
      });

      // Look for country in column 6 if not found
      if (!currentContact.country) {
        const countryValue = rowData[6]?.toString().trim();
        if (countryValue) {
          currentContact.country = countryValue;
        }
      }

      // Look for comments in column 9 if not found
      if (!currentContact.comments) {
        const commentsValue = rowData[9]?.toString().trim();
        if (commentsValue) {
          currentContact.comments = commentsValue;
        }
      }

      if (currentContact.name && currentContact.email) {
        contacts.push({
          name: currentContact.name,
          email: currentContact.email,
          phone: currentContact.phone || "",
          country: currentContact.country || "",
          status: "New",
          comments: currentContact.comments || "",
          source: "",
        });
      } else {
        console.log(`Skipping row ${i} - Missing required fields:`, {
          hasName: !!currentContact.name,
          hasEmail: !!currentContact.email,
          currentContact,
        });
      }
    }

    // When processing rows
    for (let i = 1; i < jsonData.length; i++) {
      const rowData = jsonData[i];
      const currentContact: Partial<ContactRequest> = {};

      // Combine name fields
      const names = headerMap.nameColumns
        .map((index) => rowData[index]?.toString().trim())
        .filter(Boolean);
      currentContact.name = names.join(" ").trim();

      // Process other fields
      Object.entries(headerMap).forEach(([indexStr, field]) => {
        if (field === "name") return;

        const index = parseInt(indexStr);
        if (isNaN(index)) return;

        const value = rowData[index]?.toString().trim();
        if (!value) return;

        switch (field) {
          case "email":
            currentContact.email = value.toLowerCase();
            break;
          case "phone":
            currentContact.phone = formatPhoneNumber(value);
            break;
          case "country":
            currentContact.country = value;
            break;
          case "comments":
            currentContact.comments = value;
            break;
        }
      });

      // Look for country in column 6 if not found
      if (!currentContact.country) {
        const countryValue = rowData[6]?.toString().trim(); // Check column 7 for country
        if (countryValue) {
          currentContact.country = countryValue;
        }
      }

      // Look for comments in column 9 if not found
      if (!currentContact.comments) {
        const commentsValue = rowData[9]?.toString().trim(); // Check column 10 for comments
        if (commentsValue) {
          currentContact.comments = commentsValue;
        }
      }

      if (currentContact.name && currentContact.email) {
        contacts.push({
          name: currentContact.name,
          email: currentContact.email,
          phone: currentContact.phone || "",
          country: currentContact.country || "",
          status: "New",
          comments: currentContact.comments || "",
          source: "",
        });
      }
    }

    // When processing rows, combine name fields and handle country
    for (let i = 1; i < jsonData.length; i++) {
      const rowData = jsonData[i];
      const currentContact: Partial<ContactRequest> = {};

      // Combine name fields
      const names = headerMap.nameColumns
        .map((index) => rowData[index]?.toString().trim())
        .filter(Boolean);
      currentContact.name = names.join(" ").trim();

      // Process other fields
      Object.entries(headerMap).forEach(([indexStr, field]) => {
        if (field === "name") return; // Skip name fields as we handled them above

        const index = parseInt(indexStr);
        if (isNaN(index)) return; // Skip non-numeric indices (like nameColumns)

        const value = rowData[index]?.toString().trim();
        if (!value) return;

        switch (field) {
          case "email":
            currentContact.email = value.toLowerCase();
            break;
          case "phone":
            currentContact.phone = formatPhoneNumber(value);
            break;
          case "country":
            currentContact.country = value;
            break;
        }
      });

      // Look for country in specific columns if not found
      if (!currentContact.country) {
        const countryValue = rowData[7]?.toString().trim(); // Check column 8 for country
        if (countryValue) {
          currentContact.country = countryValue;
        }
      }

      if (currentContact.name && currentContact.email) {
        contacts.push({
          name: currentContact.name,
          email: currentContact.email,
          phone: currentContact.phone || "",
          country: currentContact.country || "",
          status: "New",
          comments: "",
          source: "",
        });
      }
    }

    // Log the original headers and their normalized versions for debugging
    console.log("Original headers:", headers);
    console.log(
      "Normalized headers:",
      headers.map((h) => h?.toLowerCase().replace(/\s+/g, "").trim())
    );
    console.log("Detected column mappings:", headerMap);

    console.log("Detected column mappings:", headerMap);

    // When processing rows, use the mapped columns
    for (let i = 1; i < jsonData.length; i++) {
      const rowData = jsonData[i];
      const currentContact: Partial<ContactRequest> = {};

      Object.entries(headerMap).forEach(([index, field]) => {
        const value = rowData[parseInt(index)]?.toString().trim();
        if (!value) return;

        switch (field) {
          case "name":
            currentContact.name = value;
            break;
          case "email":
            currentContact.email = value.toLowerCase();
            break;
          case "phone":
            currentContact.phone = formatPhoneNumber(value);
            break;
          case "country":
            currentContact.country = value;
            break;
          case "comments":
            currentContact.comments = value;
            break;
        }
      });

      if (currentContact.name && currentContact.email) {
        contacts.push({
          name: currentContact.name,
          email: currentContact.email,
          phone: currentContact.phone || "",
          country: currentContact.country || "",
          status: "New",
          comments: currentContact.comments || "",
          source: "",
        });
      }
    }

    console.log("Header mapping:", headerMap);

    function formatPhoneNumber(phone: string): string {
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

    let skippedRows = 0;
    let processedRows = 0;

    for (let i = 1; i < jsonData.length; i++) {
      const rowData = jsonData[i];
      if (!rowData.some((cell) => cell)) {
        skippedRows++;
        continue;
      }

      processedRows++;
      const currentContact: Partial<ContactRequest> = {};

      // Log the current row data
      console.log(`Processing row ${i}:`, rowData);

      // Process each cell according to the header mapping
      Object.entries(headerMap).forEach(([index, field]) => {
        const value = rowData[parseInt(index)]?.toString().trim();
        if (!value) return;

        switch (field) {
          case "name":
            currentContact.name = value;
            break;
          case "email":
            currentContact.email = value.toLowerCase();
            break;
          case "phone":
            currentContact.phone = formatPhoneNumber(value);
            break;
          case "country":
            currentContact.country = value;
            break;
        }
      });

      // Explicitly check for country in column 9 if not already set
      if (!currentContact.country && rowData[8]) {
        currentContact.country = rowData[8].toString().trim();
      }

      console.log(`Contact object for row ${i}:`, currentContact);

      if (currentContact.name && currentContact.email) {
        contacts.push({
          name: currentContact.name,
          email: currentContact.email,
          phone: currentContact.phone || "",
          country: currentContact.country || "",
          status: "New",
          comments: "",
          source: "",
        });
      } else {
        console.log(`Skipping row ${i} - Missing required fields:`, {
          hasName: !!currentContact.name,
          hasEmail: !!currentContact.email,
        });
        skippedRows++;
      }
    }

    console.log("Processing summary:", {
      totalRows: jsonData.length - 1,
      processedRows,
      skippedRows,
      validContacts: contacts.length,
    });

    if (contacts.length === 0) {
      throw new Error(
        `No valid contacts found. Processed ${processedRows} rows, skipped ${skippedRows} rows. Check header mapping and data format.`
      );
    }

    console.log("First few contacts:", contacts.slice(0, 3));
    console.log(`Processed ${contacts.length} valid contacts`);
    return contacts;
  } catch (error) {
    console.error("Error processing Excel file:", error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type");
    let contacts: ContactRequest[] = [];

    if (contentType?.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return NextResponse.json(
          { error: "No file uploaded" },
          { status: 400 }
        );
      }

      console.log("File received:", file.name, "Size:", file.size);
      const buffer = await file.arrayBuffer();
      contacts = await processExcelData(buffer);
    } else if (contentType?.includes("text/plain")) {
      const text = await request.text();
      contacts = await processTextData(text);
    } else {
      return NextResponse.json(
        { error: "Unsupported content type" },
        { status: 400 }
      );
    }

    if (contacts.length === 0) {
      return NextResponse.json(
        {
          error: "No valid contacts found",
          details:
            "Data processing completed but no valid contacts were created",
          debug: {
            headers: headerMappings,
            requiredFields: ["name/full name", "email"],
            acceptedHeaders: {
              required: {
                name: headerMappings.name,
                email: headerMappings.email,
              },
              optional: {
                phone: headerMappings.phone,
                company: headerMappings.company,
                status: headerMappings.status,
              },
            },
          },
        },
        { status: 400 }
      );
    }

    return executeDbOperation(async () => {
      // Add user information to each contact
      const contactsWithUser = contacts.map((contact) => ({
        ...contact,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      }));

      const createdContacts = await Contact.create(contactsWithUser);

      // Log activity
      await logActivity({
        type: "IMPORT",
        userId: session.user.id,
        details: `Imported ${createdContacts.length} contacts`,
        metadata: {
          count: createdContacts.length,
          source: contentType?.includes("multipart/form-data")
            ? "excel"
            : "paste",
        },
      });

      return NextResponse.json(
        {
          message: "Contacts created successfully",
          created: createdContacts.length,
          contacts: createdContacts,
        },
        { status: 201 }
      );
    }, "Error creating contacts").catch((err) => {
      console.error("Error in contact creation:", err);

      if (err instanceof Error) {
        if (err.name === "ValidationError") {
          return NextResponse.json(
            {
              error: "Validation error",
              details: err.message,
            },
            { status: 400 }
          );
        }
        if (err instanceof MongoServerError && err.code === 11000) {
          return NextResponse.json(
            {
              error: "Some contacts already exist",
              details: "Duplicate email addresses found",
            },
            { status: 409 }
          );
        }
      }

      return NextResponse.json(
        {
          error: "Failed to create contacts",
          details: err instanceof Error ? err.message : "Unknown error",
        },
        { status: 400 }
      );
    });
  } catch (err) {
    console.error("Error processing data:", err);
    return NextResponse.json(
      {
        error: "Error processing data",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return executeDbOperation(async () => {
      const contacts = await Contact.find({})
        .sort({ createdAt: -1 })
        .populate("assignedTo", "firstName lastName email");
      return NextResponse.json(contacts, { status: 200 });
    }, "Error fetching contacts");
  } catch (error) {
    console.error("Error in GET contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, ...updateData } = await request.json();

    return executeDbOperation(async () => {
      const updatedContact = await Contact.findByIdAndUpdate(
        id,
        {
          ...updateData,
          updatedAt: new Date(),
          updatedBy: session.user.id,
        },
        { new: true }
      ).populate("assignedTo", "firstName lastName email");

      if (!updatedContact) {
        return NextResponse.json(
          { error: "Contact not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(updatedContact, { status: 200 });
    }, "Error updating contact");
  } catch (error) {
    console.error("Error in PUT contact:", error);
    return NextResponse.json(
      { error: "Failed to update contact" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Contact ID is required" },
        { status: 400 }
      );
    }

    return executeDbOperation(async () => {
      const deletedContact = await Contact.findByIdAndDelete(id);

      if (!deletedContact) {
        return NextResponse.json(
          { error: "Contact not found" },
          { status: 404 }
        );
      }

      await logActivity({
        type: "DELETE",
        userId: session.user.id,
        details: `Deleted contact: ${deletedContact.email}`,
        metadata: {
          contactId: id,
          email: deletedContact.email,
        },
      });

      return NextResponse.json(
        { message: "Contact deleted successfully" },
        { status: 200 }
      );
    }, "Error deleting contact");
  } catch (error) {
    console.error("Error in DELETE contact:", error);
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}

async function logActivity({
  type,
  userId,
  details,
  metadata = {},
}: ActivityLog): Promise<void> {
  try {
    await Activity.create({
      type,
      userId,
      details,
      metadata,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}
