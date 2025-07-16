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

    const leadId = searchParams?.get("lead");
    if (leadId && leads.length > 0) {
      const lead = leads.find((l) => l._id === leadId);
      if (lead && lead._id !== selectedLead?._id) {
        setSelectedLead(lead);
        setIsPanelOpen(true);
      }
    } else if (!leadId && selectedLead) {
      setSelectedLead(null);
      setIsPanelOpen(false);
    }
  }, [searchParams, leads, selectedLead, setSelectedLead, setIsPanelOpen]);

  // Sync state to URL
  const updateUrl = (lead: Lead | null) => {
    if (isUpdatingRef.current) return;

    isUpdatingRef.current = true;

    const params = new URLSearchParams(searchParams?.toString() || "");

    if (lead?._id) {
      params.set("lead", lead._id);
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
