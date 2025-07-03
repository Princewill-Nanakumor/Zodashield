// src/components/dashboardComponents/LeadDetailsPanel.tsx
"use client";

import React, { FC, useState, useCallback, useRef, useEffect } from "react";
import { Lead } from "@/types/leads";
import { LeadHeader } from "../leads/leadDetailsPanel/LeadHeader";
import { ContactSection } from "../leads/leadDetailsPanel/ContactSection";
import { DetailsSection } from "../leads/leadDetailsPanel/DetailsSection";
import LeadStatus from "../leads/leadDetailsPanel/LeadStatus";
import CommentsAndActivities from "../leads/leadDetailsPanel/CommentsAndActivities";
import { useToast } from "@/components/ui/use-toast";
import {
  useSelectedLead,
  useUpdateLeadOptimistically,
  useRevertLeadUpdate,
} from "@/stores/leadsStore";

const leadDetailsCache = new Map<string, { data: Lead; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache invalidation function
export const invalidateLeadCache = (leadId?: string) => {
  if (leadId) {
    leadDetailsCache.delete(leadId);
  } else {
    leadDetailsCache.clear();
  }
};

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
  const updateLeadOptimistically = useUpdateLeadOptimistically();
  const revertLeadUpdate = useRevertLeadUpdate();
  const selectedLead = useSelectedLead();

  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    details: true,
    contact: true,
    deal: true,
  });

  // Use store's selectedLead if available, otherwise fall back to prop
  const currentLead = selectedLead || lead;

  const isFetchingRef = useRef(false);
  const lastFetchedRef = useRef<Record<string, number>>({});
  const currentLeadIdRef = useRef<string | null>(null);

  // Store the latest onLeadUpdated function in a ref
  const onLeadUpdatedRef = useRef(onLeadUpdated);
  onLeadUpdatedRef.current = onLeadUpdated;

  // Store the latest toast function in a ref
  const toastRef = useRef(toast);
  toastRef.current = toast;

  // Memoized fetch function with proper assignment handling
  const fetchLeadDetails = useCallback(async () => {
    if (!currentLead?._id || !isOpen || isFetchingRef.current) return;

    // Prevent duplicate fetches for the same lead
    if (currentLeadIdRef.current === currentLead._id) return;

    const cachedData = leadDetailsCache.get(currentLead._id);
    const now = Date.now();
    const lastFetched = lastFetchedRef.current[currentLead._id] || 0;

    if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
      // Validate cached data - check if assignedTo user still exists
      if (
        cachedData.data.assignedTo &&
        typeof cachedData.data.assignedTo === "object"
      ) {
        try {
          const userResponse = await fetch(
            `/api/users/${cachedData.data.assignedTo.id}`
          );
          if (!userResponse.ok) {
            // User doesn't exist, invalidate cache and refetch
            leadDetailsCache.delete(currentLead._id);
          } else {
            // User exists, use cached data
            updateLeadOptimistically(currentLead._id, cachedData.data);
            return;
          }
        } catch {
          // Error checking user, invalidate cache and refetch
          leadDetailsCache.delete(currentLead._id);
        }
      } else {
        // No assignment or string assignment, use cached data
        updateLeadOptimistically(currentLead._id, cachedData.data);
        return;
      }
    }

    if (now - lastFetched < 1000) {
      return;
    }

    isFetchingRef.current = true;
    currentLeadIdRef.current = currentLead._id;
    lastFetchedRef.current[currentLead._id] = now;

    try {
      const response = await fetch(`/api/leads/${currentLead._id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch lead details");
      }
      const updatedLead = await response.json();

      // Validate assignment data
      if (
        updatedLead.assignedTo &&
        typeof updatedLead.assignedTo === "object"
      ) {
        try {
          const userResponse = await fetch(
            `/api/users/${updatedLead.assignedTo.id}`
          );
          if (!userResponse.ok) {
            // User doesn't exist, clear assignment
            updatedLead.assignedTo = null;
            console.warn(
              `User ${updatedLead.assignedTo.id} not found, clearing assignment for lead ${currentLead._id}`
            );
          }
        } catch {
          // Error checking user, clear assignment
          updatedLead.assignedTo = null;
          console.warn(
            `Error checking user for lead ${currentLead._id}, clearing assignment`
          );
        }
      }

      leadDetailsCache.set(currentLead._id, {
        data: updatedLead,
        timestamp: now,
      });

      // Update store with fresh data
      updateLeadOptimistically(currentLead._id, updatedLead);
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
  }, [currentLead?._id, isOpen, updateLeadOptimistically]);

  // Only fetch when lead changes or panel opens
  useEffect(() => {
    if (isOpen && currentLead?._id) {
      fetchLeadDetails();
    }
  }, [isOpen, currentLead?._id, fetchLeadDetails]);

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

        // Update cache
        leadDetailsCache.set(updatedLead._id, {
          data: updatedLead,
          timestamp: Date.now(),
        });

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
          <LeadStatus lead={currentLead} />
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
