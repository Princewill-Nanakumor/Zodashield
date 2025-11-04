"use client";

import React, { FC, useState, useCallback, useRef, useEffect } from "react";
import { Lead } from "@/types/leads";
import { LeadHeader } from "../leads/leadDetailsPanel/LeadHeader";
import { ContactSection } from "../leads/leadDetailsPanel/ContactSection";
import { DetailsSection } from "../leads/leadDetailsPanel/DetailsSection";
import LeadStatus from "../leads/leadDetailsPanel/LeadStatus";
import CommentsAndActivities from "../leads/leadDetailsPanel/CommentsAndActivities";
import AdsImageSlider from "../ads/AdsImageSlider";
import { useQueryClient } from "@tanstack/react-query";

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

  const queryClient = useQueryClient();
  const [currentLead, setCurrentLead] = useState<Lead | null>(lead);
  const previousStatusRef = useRef<string | undefined>(undefined);
  const previousLeadRef = useRef<Lead | null>(null);

  useEffect(() => {
    if (lead) {
      previousStatusRef.current = lead.status;
      previousLeadRef.current = lead;
      setCurrentLead(lead);
    }
  }, [lead]);

  useEffect(() => {
    if (!lead?._id) return;

    const checkAndUpdateLead = () => {
      const leadsData = queryClient.getQueryData(["leads"]);
      if (!leadsData) return;

      let updatedLead: Lead | undefined;

      if (Array.isArray(leadsData)) {
        updatedLead = leadsData.find((l) => l._id === lead._id);
      } else if (leadsData && typeof leadsData === "object") {
        if ("data" in leadsData && Array.isArray(leadsData.data)) {
          updatedLead = leadsData.data.find((l) => l._id === lead._id);
        } else if ("leads" in leadsData && Array.isArray(leadsData.leads)) {
          updatedLead = leadsData.leads.find((l) => l._id === lead._id);
        }
      }

      if (updatedLead && updatedLead.status !== previousStatusRef.current) {
        previousStatusRef.current = updatedLead.status;
        setCurrentLead(updatedLead);
      }
    };

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === "updated" && event.query.queryKey[0] === "leads") {
        setTimeout(checkAndUpdateLead, 0);
      }
    });

    checkAndUpdateLead();

    return () => {
      unsubscribe();
    };
  }, [lead?._id, queryClient]);

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
      previousStatusRef.current = updatedLead.status;
      setCurrentLead(updatedLead);

      const result = await onLeadUpdatedRef.current(updatedLead);
      return result;
    } catch (error) {
      console.error("Error in handleLeadUpdated:", error);

      if (previousLeadRef.current) {
        setCurrentLead(previousLeadRef.current);
        previousStatusRef.current = previousLeadRef.current.status;
      }

      return false;
    }
  }, []);

  useEffect(() => {
    if (lead?._id && isOpen) {
      const checkCache = () => {
        const leadsData = queryClient.getQueryData(["leads"]);
        if (leadsData) {
          let freshLead: Lead | undefined;

          if (Array.isArray(leadsData)) {
            freshLead = leadsData.find((l) => l._id === lead._id);
          } else if (leadsData && typeof leadsData === "object") {
            if ("data" in leadsData && Array.isArray(leadsData.data)) {
              freshLead = leadsData.data.find((l) => l._id === lead._id);
            } else if ("leads" in leadsData && Array.isArray(leadsData.leads)) {
              freshLead = leadsData.leads.find((l) => l._id === lead._id);
            }
          }

          if (freshLead && freshLead.status !== currentLead?.status) {
            setCurrentLead(freshLead);
          }
        }
      };

      checkCache();
      const timeoutId = setTimeout(checkCache, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [lead?._id, isOpen, queryClient, currentLead?.status]);

  // Handle ESC key to close panel
  useEffect(() => {
    if (!isOpen) return;

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscKey);

    return () => {
      window.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!currentLead?._id || !isOpen) {
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
          lead={currentLead}
          onClose={onClose}
          onNavigate={onNavigate}
          hasPrevious={hasPrevious}
          hasNext={hasNext}
        />
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <LeadStatus lead={currentLead} onLeadUpdated={handleLeadUpdated} />
          <ContactSection
            lead={currentLead}
            isExpanded={expandedSections.contact}
            onToggle={() => toggleSection("contact")}
            onLeadUpdated={handleLeadUpdated}
          />
          <AdsImageSlider
            isExpanded={expandedSections.ads}
            onToggle={() => toggleSection("ads")}
          />
          <DetailsSection
            lead={currentLead}
            isExpanded={expandedSections.details}
            onToggle={() => toggleSection("details")}
            onLeadUpdated={handleLeadUpdated}
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
