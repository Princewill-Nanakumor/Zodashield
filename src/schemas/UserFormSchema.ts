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
      if (val === undefined || val === "") return true;
      return val.length >= 8;
    }, "Password must be at least 8 characters")
    .refine((val) => {
      if (val === undefined || val === "") return true;
      return /[A-Z]/.test(val);
    }, "Password must contain at least one uppercase letter")
    .refine((val) => {
      if (val === undefined || val === "") return true;
      return /[0-9]/.test(val);
    }, "Password must contain at least one number")
    .refine((val) => {
      if (val === undefined || val === "") return true;
      return /[!@#$%^&*(),.?":{}|<>]/.test(val);
    }, "Password must contain at least one special character"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  country: z.string().min(1, "Country is required"),
  role: z.string().optional().default("AGENT"),
  status: z.string().optional().default("ACTIVE"),
  permissions: z.array(z.string()).default([]),
});

export type UserFormData = z.infer<typeof UserFormSchema>;
