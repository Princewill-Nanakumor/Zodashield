// src/components/user-management/AuthGuard.tsx
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
  redirectTo?: string;
}

export function AuthGuard({
  children,
  requiredRole = "ADMIN",
  redirectTo = "/dashboard",
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (session?.user?.role !== requiredRole) {
      router.push(redirectTo);
      toast({
        title: "Unauthorized",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
    }
  }, [status, session, router, toast, requiredRole, redirectTo]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center h-screen bg-background dark:bg-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 dark:border-white border-t-transparent"></div>
      </div>
    );
  }

  if (!session || session.user.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}
