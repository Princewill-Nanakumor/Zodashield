// src/hooks/useAuthRedirect.ts
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function useAuthRedirect() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      // Redirect based on user role
      if (session.user.role === "ADMIN") {
        router.push("/dashboard");
      } else {
        router.push("/dashboard/leads");
      }
    }
  }, [session, status, router]);

  return { session, status };
}
