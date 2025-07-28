"use client";

import React, { FC, useState, useCallback, useRef } from "react";
import { Lead } from "@/types/leads";
import { LeadHeader } from "../leads/leadDetailsPanel/LeadHeader";
import { ContactSection } from "../leads/leadDetailsPanel/ContactSection";
import { DetailsSection } from "../leads/leadDetailsPanel/DetailsSection";
import LeadStatus from "../leads/leadDetailsPanel/LeadStatus";
import CommentsAndActivities from "../leads/leadDetailsPanel/CommentsAndActivities";
import AdsImageSlider from "../ads/AdsImageSlider";

interface LeadDetailsPanelProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: (updatedLead: Lead) => Promise<boolean>;
  onNavigate: (direction: "prev" | "next") => void;
  hasPrevious: boolean;
  hasNext: boolean;
}

export const LeadDetailsPanel: FC<LeadDetailsPanelProps> = ({
  lead,
  isOpen,
  onClose,
  onLeadUpdated,
  onNavigate,
  hasPrevious,
  hasNext,
}) => {
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    details: true,
    contact: true,
    ads: true,
  });

  // Store the latest onLeadUpdated function in a ref
  const onLeadUpdatedRef = useRef(onLeadUpdated);
  onLeadUpdatedRef.current = onLeadUpdated;

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const handleLeadUpdated = useCallback(async (updatedLead: Lead) => {
    try {
      // Call the parent's onLeadUpdated directly
      return await onLeadUpdatedRef.current(updatedLead);
    } catch (error) {
      console.error("Error in handleLeadUpdated:", error);
      return false;
    }
  }, []);

  // Don't render anything if no lead or not open
  if (!lead?._id || !isOpen) {
    return null;
  }

  return (
    <div
      className="fixed right-0 flex bg-white dark:bg-gray-800 border-l-2 z-50"
      style={{
        width: "80vw",
        maxWidth: "1200px",
        top: "80px",
        bottom: "80px",
        height: "calc(100vh - 160px)",
      }}
    >
      <div className="w-2/5 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-800/50">
        <LeadHeader
          lead={lead}
          onClose={onClose}
          onNavigate={onNavigate}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
        />
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <LeadStatus lead={lead} onLeadUpdated={handleLeadUpdated} />
          <ContactSection
            lead={lead}
            isExpanded={expandedSections.contact}
            onToggle={() => toggleSection("contact")}
          />
          <AdsImageSlider
            isExpanded={expandedSections.ads}
            onToggle={() => toggleSection("ads")}
          />
          <DetailsSection
            lead={lead}
            isExpanded={expandedSections.details}
            onToggle={() => toggleSection("details")}
          />
        </div>
      </div>
      <div className="flex-1 bg-white dark:bg-gray-800">
        <CommentsAndActivities
          lead={lead}
          onLeadUpdated={handleLeadUpdated}
          key={lead._id}
        />
      </div>
    </div>
  );
};

export default LeadDetailsPanel;
