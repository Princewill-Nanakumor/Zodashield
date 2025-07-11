import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientProviders from "@/components/ClientProviders";
import { Toaster } from "@/components/ui/toaster";
import { StatusProvider } from "@/context/StatusContext";
import { ThemeProvider } from "@/components/dashboardComponents/Theme-Provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZodaShied ",
  description: "Modern CRM Solution for your importing Excel & CSV files",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased `}
      >
        <ThemeProvider>
          <Toaster />
          <ClientProviders>
            <StatusProvider>{children}</StatusProvider>
          </ClientProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
