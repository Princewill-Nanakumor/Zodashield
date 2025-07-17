"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/dashboardComponents/Sidebar";
import DashboardNavbar from "@/components/dashboardComponents/DashboardNavbar";
import { SearchProvider, useSearchContext } from "@/context/SearchContext";
import { Shield } from "lucide-react";

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
      <div className="flex justify-center items-center h-screen">
        <div className="relative w-16 h-16 flex items-center justify-center">
          {/* Rotating border */}
          <div className="absolute inset-0 border-4 border-transparent border-t-blue-400 border-r-purple-500 rounded-full animate-spin w-16 h-16"></div>

          <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600">
            <Shield size={28} className="text-white" />
          </div>
        </div>
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
