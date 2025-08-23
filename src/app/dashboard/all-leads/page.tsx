// src/app/dashboard/all-leads/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LeadsPageContent from "@/components/dashboardComponents/LeadsPageContent";
import { useSearchContext } from "@/context/SearchContext";
import { Shield } from "lucide-react";

const AllLeadsPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Get search context from layout
  const { searchQuery, isLoading, setLayoutLoading } = useSearchContext();

  // Handle navigation in useEffect instead of during render
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

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

  if (
    status === "unauthenticated" ||
    (status === "authenticated" && session?.user?.role !== "ADMIN")
  ) {
    return null;
  }

  return (
    <LeadsPageContent
      searchQuery={searchQuery}
      isLoading={isLoading}
      setLayoutLoading={setLayoutLoading}
    />
  );
};

export default AllLeadsPage;
