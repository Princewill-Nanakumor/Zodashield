// src/hooks/useOptimizedLeads.ts
import { useCallback } from "react";
import { useLeadsStore } from "@/stores/leadsStore";

export const useOptimizedLeads = () => {
  const updateLeadOptimistically = useLeadsStore(
    (state) => state.updateLeadOptimistically
  );
  const revertLeadUpdate = useLeadsStore((state) => state.revertLeadUpdate);

  const getLeadById = useCallback((id: string) => {
    const state = useLeadsStore.getState();
    return state.leads.find((lead) => lead._id === id);
  }, []);

  return {
    getLeadById,
    updateLeadOptimistically,
    revertLeadUpdate,
  };
};
