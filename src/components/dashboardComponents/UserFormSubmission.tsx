import { useState } from "react";
import { UserFormSchema, UserFormData } from "@/schemas/UserFormSchema";
import { z } from "zod";

interface ValidationError {
  field: string;
  message: string;
}

interface UseUserFormSubmissionProps {
  formData: UserFormData;
  setErrorsFromValidation: (errors: ValidationError[]) => void;
  setGeneralError: (error: string | null) => void;
  onSubmit: (userData: UserFormData) => Promise<void>;
  onClose: () => void;
}

export const useUserFormSubmission = ({
  formData,
  setErrorsFromValidation,
  setGeneralError,
  onSubmit,
  onClose,
}: UseUserFormSubmissionProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    try {
      // Use the zod schema to validate
      UserFormSchema.parse(formData);
      setErrorsFromValidation([]);
      return true;
    } catch (error) {
      // Type guard to check if it's a ZodError
      if (error instanceof z.ZodError) {
        // Convert zod errors to our ValidationError format
        const validationErrors: ValidationError[] = error.errors.map((err) => ({
          field: err.path[0] as string,
          message: err.message,
        }));

        setErrorsFromValidation(validationErrors);
      } else {
        // Handle other types of errors
        console.error("Validation error:", error);
        setErrorsFromValidation([]);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setGeneralError(null);

    try {
      console.log("Modal: Calling onSubmit...");
      await onSubmit(formData);
      console.log("Modal: onSubmit completed successfully");
      onClose();
    } catch (error: unknown) {
      console.error("Modal: Error submitting form:", error);
      // Display the error to the user
      if (error instanceof Error) {
        console.log("Modal: Setting general error:", error.message);
        setGeneralError(error.message);
      } else {
        console.log("Modal: Setting generic error");
        setGeneralError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleSubmit,
  };
};
