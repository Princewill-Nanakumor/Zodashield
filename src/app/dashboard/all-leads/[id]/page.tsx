// src/app/dashboard/all-leads/[id]/page.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, use, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadHeader } from "@/components/leads/leadDetailsPanel/LeadHeader";
import { ContactSection } from "@/components/leads/leadDetailsPanel/ContactSection";
import { DetailsSection } from "@/components/leads/leadDetailsPanel/DetailsSection";
import LeadStatus from "@/components/leads/leadDetailsPanel/LeadStatus";
import CommentsAndActivities from "@/components/leads/leadDetailsPanel/CommentsAndActivities";
import AdsImageSlider from "@/components/ads/AdsImageSlider";
import { LeadDetailsSkeleton } from "@/components/dashboardComponents/LeadDetailsSkeleton";
import { Lead } from "@/types/leads";

// Lead Details Content Component
const LeadDetailsPageContent = ({
  lead,
  onLeadUpdated,
  onBack,
}: {
  lead: Lead;
  onLeadUpdated: (updatedLead: Lead) => Promise<boolean>;
  onBack: () => void;
}) => {
  const queryClient = useQueryClient();
  const [currentLead, setCurrentLead] = useState<Lead>(lead);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    details: true,
    contact: true,
    ads: true,
  });

  // Update current lead when prop changes
  useEffect(() => {
    setCurrentLead(lead);
  }, [lead]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const handleLeadUpdated = useCallback(
    async (updatedLead: Lead) => {
      try {
        setCurrentLead(updatedLead);

        await onLeadUpdated(updatedLead);

        await queryClient.invalidateQueries({ queryKey: ["leads"] });

        await queryClient.invalidateQueries({
          queryKey: ["lead", updatedLead._id],
        });

        return true;
      } catch (error) {
        console.error("Error in handleLeadUpdated:", error);
        return false;
      }
    },
    [onLeadUpdated, queryClient]
  );

  const handleNavigate = () => {};
  const hasPrevious = false;
  const hasNext = false;

  return (
    <div className="h-screen bg-white dark:bg-gray-800 flex flex-col">
      <div
        className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg"
        style={{
          height: "calc(100vh - 0px)",
        }}
      >
        {/* Left Panel - Lead Details */}
        <div className="w-2/5 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-800/50">
          <LeadHeader
            lead={currentLead}
            onClose={onBack}
            onNavigate={handleNavigate}
            hasPrevious={hasPrevious}
            hasNext={hasNext}
            hideNavigation={true}
            hideClose={true}
          />
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <LeadStatus lead={currentLead} onLeadUpdated={handleLeadUpdated} />
            <ContactSection
              lead={currentLead}
              isExpanded={expandedSections.contact}
              onToggle={() => toggleSection("contact")}
            />
            <AdsImageSlider
              isExpanded={expandedSections.ads}
              onToggle={() => toggleSection("ads")}
            />
            <DetailsSection
              lead={currentLead}
              isExpanded={expandedSections.details}
              onToggle={() => toggleSection("details")}
            />
          </div>
        </div>
        <div className="flex-1 bg-white dark:bg-gray-800">
          <CommentsAndActivities
            lead={currentLead}
            onLeadUpdated={handleLeadUpdated}
            key={currentLead._id}
          />
        </div>
      </div>
    </div>
  );
};

// Main Page Component
const LeadDetailsPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [lead, setLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Unwrap params using React.use()
  const { id } = use(params);

  // Authentication check
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  // Fetch lead data
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

  // Handle lead updates
  const handleLeadUpdated = useCallback(async (updatedLead: Lead) => {
    try {
      setLead(updatedLead);
      return true;
    } catch (error) {
      console.error("Error updating lead:", error);
      return false;
    }
  }, []);

  // Handle back navigation - preserve filters
  const handleBack = useCallback(() => {
    const params = searchParams.toString();
    const backUrl = params
      ? `/dashboard/all-leads?${params}`
      : "/dashboard/all-leads";
    router.push(backUrl);
  }, [router, searchParams]);

  // Update page title when lead is loaded
  useEffect(() => {
    if (lead) {
      const fullName = `${lead.firstName} ${lead.lastName}`;
      document.title = `${fullName} - Lead Details`;
    }
  }, [lead]);

  console.log("Component state:", { status, isLoading, error, lead: !!lead });

  // Loading state - using skeleton
  if (status === "loading" || isLoading) {
    return <LeadDetailsSkeleton />;
  }

  // Authentication redirects
  if (status === "unauthenticated") {
    return null;
  }

  if (status === "authenticated" && session?.user?.role !== "ADMIN") {
    return null;
  }

  // Error state
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

  // Lead not found
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

  // Main content
  return (
    <LeadDetailsPageContent
      lead={lead}
      onLeadUpdated={handleLeadUpdated}
      onBack={handleBack}
    />
  );
};

export default LeadDetailsPage;
