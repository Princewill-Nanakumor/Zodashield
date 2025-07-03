// src/stores/leadsStore.ts
import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";
import { Lead } from "@/types/leads";
import { User } from "@/types/user.types";

interface LeadsState {
  // Data
  leads: Lead[];
  users: User[];
  selectedLeads: Lead[];
  selectedLead: Lead | null;

  // Loading states
  isLoadingLeads: boolean;
  isLoadingUsers: boolean;

  // UI state
  filterByUser: string;
  isPanelOpen: boolean;

  // Table state
  pageSize: number;
  pageIndex: number;
  sorting: Array<{ id: string; desc: boolean }>;

  // Actions
  setLeads: (leads: Lead[]) => void;
  setUsers: (users: User[]) => void;
  setSelectedLeads: (leads: Lead[]) => void;
  setSelectedLead: (lead: Lead | null) => void;
  setFilterByUser: (filter: string) => void;
  setIsPanelOpen: (open: boolean) => void;
  setLoadingLeads: (loading: boolean) => void;
  setLoadingUsers: (loading: boolean) => void;
  setPageSize: (size: number) => void;
  setPageIndex: (index: number) => void;
  setSorting: (sorting: Array<{ id: string; desc: boolean }>) => void;

  // Optimized update actions
  updateLead: (leadId: string, updates: Partial<Lead>) => void;
  updateLeadOptimistically: (leadId: string, updates: Partial<Lead>) => void;
  revertLeadUpdate: (leadId: string, originalData: Partial<Lead>) => void;
}

export const useLeadsStore = create<LeadsState>()(
  devtools(
    persist(
      subscribeWithSelector((set) => ({
        // Initial state
        leads: [],
        users: [],
        selectedLeads: [],
        selectedLead: null,
        isLoadingLeads: false,
        isLoadingUsers: false,
        filterByUser: "all",
        isPanelOpen: false,
        pageSize: 15,
        pageIndex: 0,
        sorting: [],

        // Actions
        setLeads: (leads) => set({ leads }),
        setUsers: (users) => set({ users }),
        setSelectedLeads: (selectedLeads) => set({ selectedLeads }),
        setSelectedLead: (selectedLead) => set({ selectedLead }),
        setFilterByUser: (filterByUser) => set({ filterByUser, pageIndex: 0 }),
        setIsPanelOpen: (isPanelOpen) => set({ isPanelOpen }),
        setLoadingLeads: (isLoadingLeads) => set({ isLoadingLeads }),
        setLoadingUsers: (isLoadingUsers) => set({ isLoadingUsers }),
        setPageSize: (pageSize) => set({ pageSize, pageIndex: 0 }),
        setPageIndex: (pageIndex) => set({ pageIndex }),
        setSorting: (sorting) => set({ sorting, pageIndex: 0 }),

        // Optimized update actions
        updateLead: (leadId, updates) =>
          set((state) => {
            const updatedLeads = state.leads.map((lead) =>
              lead._id === leadId ? { ...lead, ...updates } : lead
            );

            const updatedSelectedLeads = state.selectedLeads.map((lead) =>
              lead._id === leadId ? { ...lead, ...updates } : lead
            );

            const updatedSelectedLead =
              state.selectedLead?._id === leadId
                ? { ...state.selectedLead, ...updates }
                : state.selectedLead;

            return {
              leads: updatedLeads,
              selectedLeads: updatedSelectedLeads,
              selectedLead: updatedSelectedLead,
            };
          }),

        updateLeadOptimistically: (leadId, updates) =>
          set((state) => {
            const updatedLeads = state.leads.map((lead) =>
              lead._id === leadId ? { ...lead, ...updates } : lead
            );

            const updatedSelectedLeads = state.selectedLeads.map((lead) =>
              lead._id === leadId ? { ...lead, ...updates } : lead
            );

            const updatedSelectedLead =
              state.selectedLead?._id === leadId
                ? { ...state.selectedLead, ...updates }
                : state.selectedLead;

            return {
              leads: updatedLeads,
              selectedLeads: updatedSelectedLeads,
              selectedLead: updatedSelectedLead,
            };
          }),

        revertLeadUpdate: (leadId, originalData) =>
          set((state) => {
            const revertedLeads = state.leads.map((lead) =>
              lead._id === leadId ? { ...lead, ...originalData } : lead
            );

            const revertedSelectedLeads = state.selectedLeads.map((lead) =>
              lead._id === leadId ? { ...lead, ...originalData } : lead
            );

            const revertedSelectedLead =
              state.selectedLead?._id === leadId
                ? { ...state.selectedLead, ...originalData }
                : state.selectedLead;

            return {
              leads: revertedLeads,
              selectedLeads: revertedSelectedLeads,
              selectedLead: revertedSelectedLead,
            };
          }),
      })),
      {
        name: "leads-store",
        partialize: (state) => ({
          filterByUser: state.filterByUser,
          pageSize: state.pageSize,
          sorting: state.sorting,
        }),
      }
    )
  )
);

// Individual hooks for specific state slices
export const useSelectedLead = () => {
  return useLeadsStore((state) => state.selectedLead);
};

export const useSelectedLeads = () => {
  return useLeadsStore((state) => state.selectedLeads);
};

export const useAssignedLeadsCount = () => {
  return useLeadsStore((state) => {
    return state.selectedLeads.filter((lead) => lead.assignedTo).length;
  });
};

// Individual action hooks to avoid object creation
export const useSetSelectedLead = () => {
  return useLeadsStore((state) => state.setSelectedLead);
};

export const useSetIsPanelOpen = () => {
  return useLeadsStore((state) => state.setIsPanelOpen);
};

export const useSetSelectedLeads = () => {
  return useLeadsStore((state) => state.setSelectedLeads);
};

export const useSetFilterByUser = () => {
  return useLeadsStore((state) => state.setFilterByUser);
};

export const useSetLeads = () => {
  return useLeadsStore((state) => state.setLeads);
};

export const useSetUsers = () => {
  return useLeadsStore((state) => state.setUsers);
};

export const useSetLoadingLeads = () => {
  return useLeadsStore((state) => state.setLoadingLeads);
};

export const useSetLoadingUsers = () => {
  return useLeadsStore((state) => state.setLoadingUsers);
};

export const useUpdateLeadOptimistically = () => {
  return useLeadsStore((state) => state.updateLeadOptimistically);
};

export const useRevertLeadUpdate = () => {
  return useLeadsStore((state) => state.revertLeadUpdate);
};

// Table state hooks
export const usePageSize = () => {
  return useLeadsStore((state) => state.pageSize);
};

export const usePageIndex = () => {
  return useLeadsStore((state) => state.pageIndex);
};

export const useSorting = () => {
  return useLeadsStore((state) => state.sorting);
};

export const useSetPageSize = () => {
  return useLeadsStore((state) => state.setPageSize);
};

export const useSetPageIndex = () => {
  return useLeadsStore((state) => state.setPageIndex);
};

export const useSetSorting = () => {
  return useLeadsStore((state) => state.setSorting);
};

// UI state hooks
export const useFilterByUser = () => {
  return useLeadsStore((state) => state.filterByUser);
};

export const useIsPanelOpen = () => {
  return useLeadsStore((state) => state.isPanelOpen);
};

export const useIsLoadingLeads = () => {
  return useLeadsStore((state) => state.isLoadingLeads);
};

export const useIsLoadingUsers = () => {
  return useLeadsStore((state) => state.isLoadingUsers);
};
