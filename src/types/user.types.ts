// src/types/user.types.ts
export interface User {
  id: string;
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  country?: string;
  role: "ADMIN" | "USER";
  status: "ACTIVE" | "INACTIVE";
  permissions: string[];
  createdAt?: Date;
  updatedAt?: Date;
  name: string;
}

export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  country?: string;
  role: "ADMIN" | "USER";
  status: "ACTIVE" | "INACTIVE";
  permissions: string[];
}

export interface ApiError {
  message: string;
  status?: number;
}
