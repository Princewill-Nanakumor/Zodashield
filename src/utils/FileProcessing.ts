// src/utils/fileProcessing.ts

import { ProcessedLead } from "@/types/import";
import { isValidationError } from "@/types/import";
import { processExcelFile, processTextData } from "./processors";

// Type guard for objects with a string message property
function hasMessageProperty(error: unknown): error is { message: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  );
}

// Type guard for missing headers error
function isMissingHeadersError(
  error: unknown
): error is { type: string; missingFields: string[] } {
  return (
    typeof error === "object" &&
    error !== null &&
    "type" in error &&
    (error as { type?: string }).type === "MISSING_HEADERS" &&
    Array.isArray((error as { missingFields?: unknown }).missingFields)
  );
}

export async function processFile(
  file: File,
  onSuccess: (leads: ProcessedLead[]) => Promise<void>,
  onValidationError: (missingFields: string[]) => void,
  onError: (message: string) => void,
  onFinally: () => void
) {
  try {
    console.log("�� Processing file:", {
      name: file.name,
      type: file.type,
      size: file.size,
    });

    let processedLeads: ProcessedLead[];

    if (file.type === "text/plain" || file.type === "text/csv") {
      console.log("�� Processing as text/CSV file");
      const text = await file.text();
      console.log("📄 File content (first 500 chars):", text.substring(0, 500));

      try {
        processedLeads = await processTextData(text);
        console.log(
          "✅ Text processing successful, leads count:",
          processedLeads.length
        );
      } catch (error: unknown) {
        console.error("❌ Text processing error:", error);

        if (isMissingHeadersError(error)) {
          console.log("❌ Missing headers error:", error.missingFields);
          onValidationError(error.missingFields);
          return;
        }
        if (isValidationError(error)) {
          console.log("❌ Validation error:", error.missingFields);
          onValidationError(error.missingFields);
          return;
        }
        if (error instanceof Error) {
          throw error;
        }
        if (hasMessageProperty(error)) {
          throw error;
        }
        throw new Error("An unexpected error occurred");
      }
    } else {
      console.log("📊 Processing as Excel file");
      try {
        processedLeads = await processExcelFile(file);
        console.log(
          "✅ Excel processing successful, leads count:",
          processedLeads.length
        );
      } catch (error: unknown) {
        console.error("❌ Excel processing error:", error);

        if (isMissingHeadersError(error)) {
          console.log("❌ Missing headers error:", error.missingFields);
          onValidationError(error.missingFields);
          return;
        }
        if (isValidationError(error)) {
          console.log("❌ Validation error:", error.missingFields);
          onValidationError(error.missingFields);
          return;
        }
        if (error instanceof Error) {
          throw error;
        }
        if (hasMessageProperty(error)) {
          throw error;
        }
        throw new Error("An unexpected error occurred");
      }
    }

    console.log("✅ Final processed leads:", processedLeads.slice(0, 2));
    await onSuccess(processedLeads);
  } catch (error) {
    let message = "An unexpected error occurred";
    if (error instanceof Error && error.message) {
      message = error.message;
    } else if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
    ) {
      message = (error as { message: string }).message;
    }
    if (typeof error === "object") {
      console.error("Import error:", JSON.stringify(error, null, 2));
    } else {
      console.error("Import error:", error);
    }
    onError(message);
  } finally {
    onFinally();
  }
}
