// src/context/ContactsContext.tsx
"use client";

import { createContext, useContext, useState } from "react";

interface Contact {
  name: string;
  email: string;
  phone?: string;
  source?: string;
  status?: string;
  country?: string;
  comments?: string;
}

interface ContactsContextType {
  contacts: Contact[];
  setContacts: (contacts: Contact[]) => void;
}

const ContactsContext = createContext<ContactsContextType | undefined>(
  undefined
);

export function ContactsProvider({ children }: { children: React.ReactNode }) {
  const [contacts, setContacts] = useState<Contact[]>([]);

  return (
    <ContactsContext.Provider value={{ contacts, setContacts }}>
      {children}
    </ContactsContext.Provider>
  );
}

export function useContacts() {
  const context = useContext(ContactsContext);
  if (undefined === context) {
    throw new Error("useContacts must be used within a ContactsProvider");
  }
  return context;
}
