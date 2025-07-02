// src/components/ClientProviders.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { ContactsProvider } from "@/context/ContactsContext";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <ContactsProvider>{children}</ContactsProvider>
    </SessionProvider>
  );
}
