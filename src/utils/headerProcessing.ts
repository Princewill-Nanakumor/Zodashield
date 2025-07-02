// src/utils/headerProcessing.ts
import { headerMappings } from "@/constants/headMappings";

export function normalizeHeader(header: string): string | null {
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

export function validateHeaders(headers: string[]): string[] {
  const missingRequired = ["name", "email"].filter(
    (required) =>
      !headers.some((header) =>
        headerMappings[required]
          .map((v) => v.toLowerCase())
          .includes(header.toLowerCase())
      )
  );

  return missingRequired;
}
