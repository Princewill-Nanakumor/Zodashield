// src/app/dashboard/all-leads/[id]/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import LeadDetailsPanel from "@/components/dashboardComponents/LeadDetailsPanel";
import { Lead } from "@/types/leads";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

interface LeadDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

const LeadDetailsPage: React.FC<LeadDetailsPageProps> = ({ params }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { id } = use(params);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  useEffect(() => {
    const fetchLead = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching lead with ID:", id);

        const response = await fetch(`/api/leads/${id}`, {
          credentials: "include",
        });

        console.log("Response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error("API Error:", errorData);
          throw new Error(errorData.error || "Failed to fetch lead");
        }

        const leadData = await response.json();
        console.log("Lead data received:", leadData);
        setLead(leadData);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    if (id && status === "authenticated") {
      fetchLead();
    }
  }, [id, status]);

  const handleLeadUpdated = async (updatedLead: Lead) => {
    setLead(updatedLead);
    return true;
  };

  const handleBack = () => {
    router.push("/dashboard/all-leads");
  };

  console.log("Component state:", { status, isLoading, error, lead: !!lead });

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-gray-500 dark:text-gray-400" />
          <span className="text-gray-600 dark:text-gray-400">
            Loading lead details...
          </span>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (status === "authenticated" && session?.user?.role !== "ADMIN") {
    return null;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Lead
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Leads
          </Button>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Lead Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The lead you&lsquo;re looking for doesn&lsquo;t exist or has been
            removed.
          </p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Leads
          </Button>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={handleBack} variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to All Leads
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Lead Details
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {lead.name || `${lead.firstName} ${lead.lastName}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <LeadDetailsPanel
            lead={lead}
            isOpen={true}
            onClose={handleBack}
            onLeadUpdated={handleLeadUpdated}
            onNavigate={() => {}}
            hasPrevious={false}
            hasNext={false}
          />
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default LeadDetailsPage;
