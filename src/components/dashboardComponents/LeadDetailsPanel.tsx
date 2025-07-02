"use client";

import React, { FC, useState, useCallback, useRef, useEffect } from "react";
import { Lead } from "@/types/leads";
import { LeadHeader } from "../leads/leadDetailsPanel/LeadHeader";
import { ContactSection } from "../leads/leadDetailsPanel/ContactSection";
import { DetailsSection } from "../leads/leadDetailsPanel/DetailsSection";
import LeadStatus from "../leads/leadDetailsPanel/LeadStatus";
import CommentsAndActivities from "../leads/leadDetailsPanel/CommentsAndActivities";
import { useToast } from "@/components/ui/use-toast";

const leadDetailsCache = new Map<string, { data: Lead; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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
  const { toast } = useToast();
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    details: true,
    contact: true,
    deal: true,
  });

  // Add local state for the current lead being displayed
  const [currentLead, setCurrentLead] = useState<Lead | null>(lead);

  const isFetchingRef = useRef(false);
  const lastFetchedRef = useRef<Record<string, number>>({});
  const currentLeadIdRef = useRef<string | null>(null);

  // Store the latest onLeadUpdated function in a ref
  const onLeadUpdatedRef = useRef(onLeadUpdated);
  onLeadUpdatedRef.current = onLeadUpdated;

  // Store the latest toast function in a ref
  const toastRef = useRef(toast);
  toastRef.current = toast;

  // Update currentLead when lead prop changes
  useEffect(() => {
    setCurrentLead(lead);
  }, [lead]);

  // Memoized fetch function
  const fetchLeadDetails = useCallback(async () => {
    if (!lead?._id || !isOpen || isFetchingRef.current) return;

    // Prevent duplicate fetches for the same lead
    if (currentLeadIdRef.current === lead._id) return;

    const cachedData = leadDetailsCache.get(lead._id);
    const now = Date.now();
    const lastFetched = lastFetchedRef.current[lead._id] || 0;

    if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
      // Just update the local state, don't call onLeadUpdated
      setCurrentLead(cachedData.data);
      return;
    }

    if (now - lastFetched < 1000) {
      return;
    }

    isFetchingRef.current = true;
    currentLeadIdRef.current = lead._id;
    lastFetchedRef.current[lead._id] = now;

    try {
      const response = await fetch(`/api/leads/${lead._id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch lead details");
      }
      const updatedLead = await response.json();

      leadDetailsCache.set(lead._id, {
        data: updatedLead,
        timestamp: now,
      });

      // Update local state only, don't trigger onLeadUpdated
      setCurrentLead(updatedLead);
    } catch (error) {
      console.error("Error fetching lead details:", error);
      toastRef.current({
        title: "Error",
        description: "Failed to fetch lead details",
        variant: "destructive",
      });
    } finally {
      isFetchingRef.current = false;
      currentLeadIdRef.current = null;
    }
  }, [lead?._id, isOpen]);

  // Only fetch when lead changes or panel opens
  useEffect(() => {
    if (isOpen && lead?._id) {
      fetchLeadDetails();
    }
  }, [isOpen, lead?._id, fetchLeadDetails]);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  const handleStatusChange = useCallback(
    async (updatedLead: Lead): Promise<void> => {
      if (!updatedLead._id) return;

      try {
        // Update local state immediately (no need for second API call)
        setCurrentLead(updatedLead);

        // Update cache
        leadDetailsCache.set(updatedLead._id, {
          data: updatedLead,
          timestamp: Date.now(),
        });

        // Call the parent's onLeadUpdated
        await onLeadUpdatedRef.current(updatedLead);
      } catch (error) {
        console.error("Error updating lead:", error);
        throw error;
      }
    },
    []
  );

  // Handle lead updates from CommentsAndActivities
  const handleLeadUpdated = useCallback(async (updatedLead: Lead) => {
    try {
      // Update local state
      setCurrentLead(updatedLead);

      // Update cache
      leadDetailsCache.set(updatedLead._id, {
        data: updatedLead,
        timestamp: Date.now(),
      });

      // Call the parent's onLeadUpdated
      return await onLeadUpdatedRef.current(updatedLead);
    } catch (error) {
      console.error("Error in handleLeadUpdated:", error);
      return false;
    }
  }, []);

  if (!isOpen || !currentLead?._id) {
    return null;
  }

  return (
    <div
      className={`fixed inset-y-0 right-0 flex bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      style={{ width: "80vw", maxWidth: "1200px" }}
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
          <LeadStatus lead={currentLead} onStatusChange={handleStatusChange} />
          <ContactSection
            lead={currentLead}
            isExpanded={expandedSections.contact}
            onToggle={() => toggleSection("contact")}
          />
          <DetailsSection
            lead={currentLead}
            isExpanded={expandedSections.details}
            onToggle={() => toggleSection("details")}
          />
        </div>
      </div>
      <div className="flex-1 bg-white dark:bg-gray-900">
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
