// src/utils/dbOperations.ts
import { connectMongoDB } from "@/libs/dbConfig";
import { MongoServerError } from "mongodb";

export async function executeDbOperation<T>(
  operation: () => Promise<T>,
  errorMessage: string
): Promise<T> {
  try {
    await connectMongoDB();
    return await operation();
  } catch (error) {
    console.error(`${errorMessage}:`, error);

    if (error instanceof Error) {
      if (error.name === "ValidationError") {
        throw new Error(`Validation error: ${error.message}`);
      }
      if (error instanceof MongoServerError && error.code === 11000) {
        throw new Error("Duplicate entry found");
      }
    }

    throw new Error(errorMessage);
  }
}
