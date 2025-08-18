"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/dashboardComponents/Sidebar";
import DashboardNavbar from "@/components/dashboardComponents/DashboardNavbar";
import { SearchProvider, useSearchContext } from "@/context/SearchContext";
import { Shield } from "lucide-react";
import Footer from "@/components/dashboardComponents/Footer";
import { DateTimeSettingsProvider } from "@/context/DateTimeSettingsContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { ToggleProvider } from "@/context/ToggleContext";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { searchQuery, setSearchQuery, isLoading } = useSearchContext();
  const { status, data: session } = useSession(); // Add data: session
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

  // Check if we're on a leads page AND user is admin
  const isLeadsPage = pathname?.includes("/all-leads");
  const isAdmin = session?.user?.role === "ADMIN";
  const showLeadsToggles = isLeadsPage && isAdmin;

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
          />
          <main className="flex-1 overflow-auto p-8 bg-background text-foreground">
            {children}
          </main>
          <Footer />
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
  return (
    <SearchProvider>
      <DateTimeSettingsProvider>
        <DashboardContent>{children}</DashboardContent>
      </DateTimeSettingsProvider>
    </SearchProvider>
  );
}
