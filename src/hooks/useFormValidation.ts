// src/hooks/useFormValidation.ts
"use client";

import { useState, useCallback } from "react";
import { z } from "zod";

interface UseFormValidationProps<T> {
  createSchema: z.ZodType<T, z.ZodTypeDef, unknown>;
  editSchema: z.ZodType<T, z.ZodTypeDef, unknown>;
  mode: "create" | "edit";
}

export function useFormValidation<T>({
  createSchema,
  editSchema,
  mode,
}: UseFormValidationProps<T>) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const validateForm = useCallback(
    (formData: T): boolean => {
      try {
        if (mode === "create") {
          createSchema.parse(formData);
        } else {
          editSchema.parse(formData);
        }
        setErrors({});
        setGeneralError(null);
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errorMap: Record<string, string> = {};
          error.errors.forEach((err) => {
            if (err.path) {
              errorMap[err.path[0] as string] = err.message;
            }
          });
          setErrors(errorMap);
        }
        return false;
      }
    },
    [createSchema, editSchema, mode]
  );

  const handleError = useCallback((error: unknown) => {
    if (typeof error === "string") {
      try {
        const parsed = JSON.parse(error);
        if (parsed && typeof parsed === "object") error = parsed;
      } catch {
        setGeneralError(error as string);
        return;
      }
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "field" in error &&
      "message" in error &&
      typeof (error as { field: unknown }).field === "string" &&
      typeof (error as { message: unknown }).message === "string"
    ) {
      setErrors((prev) => ({
        ...prev,
        [(error as { field: string }).field]: (error as { message: string })
          .message,
      }));
      return;
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message: unknown }).message === "string"
    ) {
      setGeneralError((error as { message: string }).message);
      return;
    }

    setGeneralError("An unexpected error occurred");
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
    setGeneralError(null);
  }, []);

  const getFieldError = useCallback(
    (field: string) => errors[field] || "",
    [errors]
  );

  return {
    errors,
    generalError,
    validateForm,
    handleError,
    clearErrors,
    getFieldError,
  };
}
