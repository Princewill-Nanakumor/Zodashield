// src/utils/errorHandlers.ts
import { MongoServerError } from "mongodb";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class DuplicateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateError";
  }
}

export function handleDatabaseError(error: unknown): Error {
  if (error instanceof MongoServerError) {
    if (error.code === 11000) {
      return new DuplicateError("A record with this email already exists");
    }
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error("An unexpected error occurred");
}

export function handleApiError(error: unknown): {
  status: number;
  message: string;
} {
  if (error instanceof ValidationError) {
    return { status: 400, message: error.message };
  }

  if (error instanceof DuplicateError) {
    return { status: 409, message: error.message };
  }

  console.error("Unhandled error:", error);
  return { status: 500, message: "Internal server error" };
}
