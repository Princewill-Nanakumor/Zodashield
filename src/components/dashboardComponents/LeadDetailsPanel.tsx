"use client";

import React, { FC, useState, useCallback, useRef } from "react";
import { Lead } from "@/types/leads";
import { LeadHeader } from "../leads/leadDetailsPanel/LeadHeader";
import { ContactSection } from "../leads/leadDetailsPanel/ContactSection";
import { DetailsSection } from "../leads/leadDetailsPanel/DetailsSection";
import LeadStatus from "../leads/leadDetailsPanel/LeadStatus";
import CommentsAndActivities from "../leads/leadDetailsPanel/CommentsAndActivities";
import AdsImageSlider from "../ads/AdsImageSlider";
import {
  useSelectedLead,
  useUpdateLeadOptimistically,
  useRevertLeadUpdate,
} from "@/stores/leadsStore";

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
  const updateLeadOptimistically = useUpdateLeadOptimistically();
  const revertLeadUpdate = useRevertLeadUpdate();
  const selectedLead = useSelectedLead();

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    details: true,
    contact: true,
    ads: true, // Add ads section
  });

  // Use store's selectedLead if available, otherwise fall back to prop
  const currentLead = selectedLead || lead;

  // Store the latest onLeadUpdated function in a ref
  const onLeadUpdatedRef = useRef(onLeadUpdated);
  onLeadUpdatedRef.current = onLeadUpdated;

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const handleLeadUpdated = useCallback(
    async (updatedLead: Lead) => {
      try {
        // Optimistic update to store
        updateLeadOptimistically(updatedLead._id, updatedLead);

        // Call the parent's onLeadUpdated
        return await onLeadUpdatedRef.current(updatedLead);
      } catch (error) {
        console.error("Error in handleLeadUpdated:", error);

        // Revert optimistic update on error
        if (currentLead) {
          revertLeadUpdate(updatedLead._id, currentLead);
        }

        return false;
      }
    },
    [updateLeadOptimistically, revertLeadUpdate, currentLead]
  );

  // Don't render anything if no lead or not open
  if (!currentLead?._id || !isOpen) {
    return null;
  }

  return (
    <div
      className="fixed right-0 flex bg-white dark:bg-gray-800 border-l-2 shadow-2xl z-50"
      style={{
        width: "80vw",
        maxWidth: "1200px",
        top: "80px", // Height of the navbar
        bottom: "0px", // Extend to bottom of viewport
        height: "calc(100vh - 80px)", // Subtract navbar height
      }}
    >
      <div className="w-2/5 border-r border-gray-200 dark:border-gray-700 flex flex-col bg-gray-50 dark:bg-gray-800/50">
        <LeadHeader
          lead={currentLead}
          onClose={onClose}
          onNavigate={onNavigate}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
        />
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <LeadStatus lead={currentLead} />
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
  );
};

export default LeadDetailsPanel;
