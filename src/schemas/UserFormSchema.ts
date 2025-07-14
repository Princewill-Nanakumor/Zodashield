// src/schemas/UserFormSchema.ts
import * as z from "zod";

export const UserFormSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required")
    .min(2, "First name must be at least 2 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .optional()
    .refine((val) => {
      if (val === undefined || val === "") return true; //
      return val.length >= 8;
    }, "Password must be at least 8 characters"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  country: z.string().min(1, "Country is required"),
});

export type UserFormData = z.infer<typeof UserFormSchema>;
