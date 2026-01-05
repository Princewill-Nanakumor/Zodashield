"use client";

import React, { useEffect } from "react";
import { useSession, SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/components/dashboardComponents/Theme-Provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { StatusProvider } from "@/context/StatusContext";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/dashboardComponents/Sidebar";
import DashboardNavbar from "@/components/dashboardComponents/DashboardNavbar";
import { SearchProvider, useSearchContext } from "@/context/SearchContext";
import { Shield } from "lucide-react";
import Footer from "@/components/dashboardComponents/Footer";
import { DateTimeSettingsProvider } from "@/context/DateTimeSettingsContext";
import { DialerSettingsProvider } from "@/context/DialerSettingsContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ToggleProvider } from "@/context/ToggleContext";
import ReminderNotifications from "@/components/notifications/ReminderNotifications";
import { Toaster } from "@/components/ui/toaster";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { searchQuery, setSearchQuery, isLoading } = useSearchContext();
  const { status, data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Use custom hook for localStorage persistence
  const [showHeader, setShowHeader] = useLocalStorage(
    "leadsToggle_showHeader",
    true
  );
  const [showControls, setShowControls] = useLocalStorage(
    "leadsToggle_showControls",
    true
  );

  // Check if we're on any leads page (admin or user)
  // Use exact path matching to avoid false positives
  const isAdminLeadsPage = pathname === "/dashboard/all-leads" || pathname?.startsWith("/dashboard/all-leads/");
  const isUserLeadsPage = pathname === "/dashboard/leads" || pathname?.startsWith("/dashboard/leads/");

  const isAdmin = session?.user?.role === "ADMIN";

  // Show toggle buttons for:
  // - Admin users on admin leads pages (/all-leads)
  // - Regular users on user leads pages (/leads)
  const showLeadsToggles =
    (isAdminLeadsPage && isAdmin) || (isUserLeadsPage && !isAdmin);

  // Show search bar only on leads pages
  const showSearch = isAdminLeadsPage || isUserLeadsPage;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-transparent border-t-blue-400 border-r-purple-500 rounded-full animate-spin w-16 h-16"></div>
          <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600">
            <Shield size={28} className="text-white" />
          </div>
        </div>
      </div>
    );
  }

  const handleToggleHeader = () => setShowHeader(!showHeader);
  const handleToggleControls = () => setShowControls(!showControls);

  const toggleContextValue = {
    showHeader,
    showControls,
    setShowHeader,
    setShowControls,
  };

  return (
    <ToggleProvider value={showLeadsToggles ? toggleContextValue : null}>
      <div className="flex h-screen bg-background text-foreground">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardNavbar
            onSearch={setSearchQuery}
            searchQuery={searchQuery}
            isLoading={isLoading}
            showLeadsToggles={showLeadsToggles}
            showHeader={showHeader}
            showControls={showControls}
            onToggleHeader={handleToggleHeader}
            onToggleControls={handleToggleControls}
            showSearch={showSearch}
          />
          <main className="flex-1 overflow-auto p-8 bg-background text-foreground">
            {children}
          </main>
          <Footer />
          <ReminderNotifications />
          <Toaster />
        </div>
      </div>
    </ToggleProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <SessionProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <StatusProvider>
            <SearchProvider>
              <DateTimeSettingsProvider>
                <DialerSettingsProvider>
                  <DashboardContent>{children}</DashboardContent>
                </DialerSettingsProvider>
              </DateTimeSettingsProvider>
            </SearchProvider>
          </StatusProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
