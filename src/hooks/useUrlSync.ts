//drivecrm/src/hooks/useUrlSync.ts

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLeadsStore } from "@/stores/leadsStore";
import { useLeads } from "@/hooks/useLeads";
import { Lead } from "@/types/leads";

export const useUrlSync = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { leads } = useLeads();
  const { selectedLead, setSelectedLead, setIsPanelOpen } = useLeadsStore();

  const isUpdatingRef = useRef(false);

  // Sync URL to state
  useEffect(() => {
    if (isUpdatingRef.current) return;

    const leadIdParam = searchParams?.get("lead");
    if (leadIdParam && leads.length > 0) {
      // Check if it's a numeric leadId (5-6 digits) or MongoDB _id
      const isNumericId = /^\d{5,6}$/.test(leadIdParam);
      let lead: Lead | undefined;

      if (isNumericId) {
        const numericId = parseInt(leadIdParam, 10);
        lead = leads.find((l) => l.leadId === numericId);
      } else {
        lead = leads.find((l) => l._id === leadIdParam);
      }

      if (lead && lead._id !== selectedLead?._id) {
        setSelectedLead(lead);
        setIsPanelOpen(true);
      }
    } else if (!leadIdParam && selectedLead) {
      setSelectedLead(null);
      setIsPanelOpen(false);
    }
  }, [searchParams, leads, selectedLead, setSelectedLead, setIsPanelOpen]);

  // Sync state to URL
  const updateUrl = (lead: Lead | null) => {
    if (isUpdatingRef.current) return;

    isUpdatingRef.current = true;

    const params = new URLSearchParams(searchParams?.toString() || "");

    if (lead) {
      // Use leadId if available, otherwise fall back to _id
      const idToUse = lead.leadId ? lead.leadId.toString() : lead._id;
      params.set("lead", idToUse);
      params.set("name", `${lead.firstName ?? ""}-${lead.lastName ?? ""}`);
    } else {
      params.delete("lead");
      params.delete("name");
    }

    // Preserve the current page parameter
    const currentPage = searchParams?.get("page");
    if (currentPage) {
      params.set("page", currentPage);
    }

    router.push(`?${params.toString()}`, { scroll: false });

    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 100);
  };

  return { updateUrl };
};
