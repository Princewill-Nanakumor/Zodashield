// src/types/contact.ts
export interface Contact {
  name: string;
  email: string;
  phone?: string;
  country?: string;
  status?: string;
  comments?: string;
  company?: string;
}

export interface ContactRequest {
  name: string;
  email: string;
  phone?: string;
  source?: string;
  status?: "New" | "Contacted" | "In Progress" | "Qualified" | "Lost" | "Won";
  country?: string;
  comments?: string;
}

export type ValidStatus =
  | "New"
  | "Contacted"
  | "In Progress"
  | "Qualified"
  | "Lost"
  | "Won";
