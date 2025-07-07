"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/dashboardComponents/Sidebar";
import DashboardNavbar from "@/components/dashboardComponents/DashboardNavbar";
import { SearchProvider, useSearchContext } from "@/context/SearchContext";

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { searchQuery, setSearchQuery, isLoading } = useSearchContext();
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardNavbar
          onSearch={setSearchQuery}
          searchQuery={searchQuery}
          isLoading={isLoading}
        />
        <main className="flex-1 overflow-auto p-8 bg-background text-foreground">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SearchProvider>
      <DashboardContent>{children}</DashboardContent>
    </SearchProvider>
  );
}
