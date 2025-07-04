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
  statuses: Array<{ id: string; name: string; color?: string }>;

  // Loading states
  isLoadingLeads: boolean;
  isLoadingUsers: boolean;
  isLoadingStatuses: boolean;

  // UI state
  filterByUser: string;
  filterByCountry: string;
  isPanelOpen: boolean;

  // Table state
  pageSize: number;
  pageIndex: number;
  sorting: Array<{ id: string; desc: boolean }>;

  // Computed state
  availableCountries: string[];
  filteredLeads: Lead[];

  // Actions
  setLeads: (leads: Lead[]) => void;
  setUsers: (users: User[]) => void;
  setStatuses: (
    statuses: Array<{ id: string; name: string; color?: string }>
  ) => void;
  setSelectedLeads: (leads: Lead[]) => void;
  setSelectedLead: (lead: Lead | null) => void;
  setFilterByUser: (filter: string) => void;
  setFilterByCountry: (filter: string) => void;
  setIsPanelOpen: (open: boolean) => void;
  setLoadingLeads: (loading: boolean) => void;
  setLoadingUsers: (loading: boolean) => void;
  setLoadingStatuses: (loading: boolean) => void;
  setPageSize: (size: number) => void;
  setPageIndex: (index: number) => void;
  setSorting: (sorting: Array<{ id: string; desc: boolean }>) => void;

  // Filter actions
  clearFilters: () => void;
  clearSelection: () => void;

  // Optimized update actions
  updateLead: (leadId: string, updates: Partial<Lead>) => void;
  updateLeadOptimistically: (leadId: string, updates: Partial<Lead>) => void;
  revertLeadUpdate: (leadId: string, originalData: Partial<Lead>) => void;

  // Bulk actions
  selectAllLeads: () => void;
  deselectAllLeads: () => void;
  toggleLeadSelection: (leadId: string) => void;
}

// Utility functions
const getAssignedUserId = (assignedTo: Lead["assignedTo"]): string | null => {
  if (!assignedTo) return null;
  if (typeof assignedTo === "string") return assignedTo;
  if (assignedTo && typeof assignedTo === "object") {
    const assignedToObj = assignedTo as Record<string, unknown>;
    return (
      (assignedToObj.id as string) || (assignedToObj._id as string) || null
    );
  }
  return null;
};

// Status resolution utility
const resolveStatusName = (
  statusId: string,
  statuses: Array<{ id: string; name: string; color?: string }>
): string => {
  const status = statuses.find((s) => s.id === statusId);
  return status?.name || statusId; // Fallback to ID if status not found
};

// Enhanced lead processing with status resolution
const processLeadsWithStatuses = (
  leads: Lead[],
  statuses: Array<{ id: string; name: string; color?: string }>
): Lead[] => {
  return leads.map((lead) => {
    const baseLead = { ...lead };

    // Handle status resolution
    if (typeof lead.status === "string") {
      baseLead.status = resolveStatusName(lead.status, statuses);
    } else if (
      typeof lead.status === "object" &&
      lead.status &&
      "id" in lead.status
    ) {
      baseLead.status = resolveStatusName(
        (lead.status as { id: string }).id,
        statuses
      );
    }

    return baseLead;
  });
};

const filterLeadsByUser = (leads: Lead[], filterByUser: string): Lead[] => {
  if (filterByUser === "all") return leads;
  if (filterByUser === "unassigned") {
    return leads.filter((lead) => !getAssignedUserId(lead.assignedTo));
  }
  return leads.filter(
    (lead) => getAssignedUserId(lead.assignedTo) === filterByUser
  );
};

const filterLeadsByCountry = (
  leads: Lead[],
  filterByCountry: string
): Lead[] => {
  if (!filterByCountry || filterByCountry === "all") return leads;
  return leads.filter(
    (lead) => lead.country?.toLowerCase() === filterByCountry.toLowerCase()
  );
};

const getAvailableCountries = (leads: Lead[]): string[] => {
  const countrySet = new Set<string>();
  leads.forEach((lead) => {
    if (lead.country?.trim()) {
      countrySet.add(lead.country.toLowerCase());
    }
  });
  return Array.from(countrySet).sort();
};

// Helper function to get filtered leads
const getFilteredLeads = (
  leads: Lead[],
  filterByUser: string,
  filterByCountry: string
): Lead[] => {
  let filtered = leads;

  // Apply user filter
  if (filterByUser !== "all") {
    filtered = filterLeadsByUser(filtered, filterByUser);
  }

  // Apply country filter
  if (filterByCountry !== "all") {
    filtered = filterLeadsByCountry(filtered, filterByCountry);
  }

  return filtered;
};

export const useLeadsStore = create<LeadsState>()(
  devtools(
    persist(
      subscribeWithSelector((set) => ({
        // Initial state
        leads: [],
        users: [],
        statuses: [],
        selectedLeads: [],
        selectedLead: null,
        isLoadingLeads: false,
        isLoadingUsers: false,
        isLoadingStatuses: false,
        filterByUser: "all",
        filterByCountry: "all",
        isPanelOpen: false,
        pageSize: 15,
        pageIndex: 0,
        sorting: [],
        availableCountries: [],
        filteredLeads: [],

        // Actions
        setLeads: (leads) =>
          set((state) => {
            const processedLeads = processLeadsWithStatuses(
              leads,
              state.statuses
            );
            const availableCountries = getAvailableCountries(processedLeads);
            const filteredLeads = getFilteredLeads(
              processedLeads,
              state.filterByUser,
              state.filterByCountry
            );
            return {
              leads: processedLeads,
              availableCountries,
              filteredLeads,
              // Reset selection if leads change significantly
              selectedLeads: state.selectedLeads.filter((selected) =>
                processedLeads.some((lead) => lead._id === selected._id)
              ),
            };
          }),

        setUsers: (users) => set({ users }),

        setStatuses: (statuses) =>
          set((state) => {
            // Reprocess leads with new statuses
            const processedLeads = processLeadsWithStatuses(
              state.leads,
              statuses
            );
            const filteredLeads = getFilteredLeads(
              processedLeads,
              state.filterByUser,
              state.filterByCountry
            );
            return {
              statuses,
              leads: processedLeads,
              filteredLeads,
            };
          }),

        setSelectedLeads: (selectedLeads) => set({ selectedLeads }),

        setSelectedLead: (selectedLead) => set({ selectedLead }),

        setFilterByUser: (filterByUser) =>
          set((state) => {
            const filteredLeads = getFilteredLeads(
              state.leads,
              filterByUser,
              state.filterByCountry
            );
            return {
              filterByUser,
              filteredLeads,
              pageIndex: 0, // Reset to first page when filter changes
              selectedLeads: [], // Clear selection when filter changes
            };
          }),

        setFilterByCountry: (filterByCountry) =>
          set((state) => {
            const filteredLeads = getFilteredLeads(
              state.leads,
              state.filterByUser,
              filterByCountry
            );
            return {
              filterByCountry,
              filteredLeads,
              pageIndex: 0, // Reset to first page when filter changes
              selectedLeads: [], // Clear selection when filter changes
            };
          }),

        setIsPanelOpen: (isPanelOpen) => set({ isPanelOpen }),

        setLoadingLeads: (isLoadingLeads) => set({ isLoadingLeads }),

        setLoadingUsers: (isLoadingUsers) => set({ isLoadingUsers }),

        setLoadingStatuses: (isLoadingStatuses) => set({ isLoadingStatuses }),

        setPageSize: (pageSize) => set({ pageSize, pageIndex: 0 }),

        setPageIndex: (pageIndex) => set({ pageIndex }),

        setSorting: (sorting) => set({ sorting, pageIndex: 0 }),

        // Filter actions
        clearFilters: () =>
          set((state) => {
            const filteredLeads = getFilteredLeads(state.leads, "all", "all");
            return {
              filterByUser: "all",
              filterByCountry: "all",
              filteredLeads,
              pageIndex: 0,
              selectedLeads: [],
            };
          }),

        clearSelection: () => set({ selectedLeads: [] }),

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

            // Recompute filtered leads and available countries
            const availableCountries = getAvailableCountries(updatedLeads);
            const filteredLeads = getFilteredLeads(
              updatedLeads,
              state.filterByUser,
              state.filterByCountry
            );

            return {
              leads: updatedLeads,
              selectedLeads: updatedSelectedLeads,
              selectedLead: updatedSelectedLead,
              availableCountries,
              filteredLeads,
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

            // Recompute filtered leads and available countries
            const availableCountries = getAvailableCountries(updatedLeads);
            const filteredLeads = getFilteredLeads(
              updatedLeads,
              state.filterByUser,
              state.filterByCountry
            );

            return {
              leads: updatedLeads,
              selectedLeads: updatedSelectedLeads,
              selectedLead: updatedSelectedLead,
              availableCountries,
              filteredLeads,
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

            // Recompute filtered leads and available countries
            const availableCountries = getAvailableCountries(revertedLeads);
            const filteredLeads = getFilteredLeads(
              revertedLeads,
              state.filterByUser,
              state.filterByCountry
            );

            return {
              leads: revertedLeads,
              selectedLeads: revertedSelectedLeads,
              selectedLead: revertedSelectedLead,
              availableCountries,
              filteredLeads,
            };
          }),

        // Bulk actions
        selectAllLeads: () =>
          set((state) => ({ selectedLeads: [...state.filteredLeads] })),

        deselectAllLeads: () => set({ selectedLeads: [] }),

        toggleLeadSelection: (leadId) =>
          set((state) => {
            const isSelected = state.selectedLeads.some(
              (lead) => lead._id === leadId
            );
            if (isSelected) {
              return {
                selectedLeads: state.selectedLeads.filter(
                  (lead) => lead._id !== leadId
                ),
              };
            } else {
              const leadToAdd = state.filteredLeads.find(
                (lead) => lead._id === leadId
              );
              return {
                selectedLeads: leadToAdd
                  ? [...state.selectedLeads, leadToAdd]
                  : state.selectedLeads,
              };
            }
          }),
      })),
      {
        name: "leads-store",
        partialize: (state) => ({
          filterByUser: state.filterByUser,
          filterByCountry: state.filterByCountry,
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
    return state.selectedLeads.filter((lead) =>
      getAssignedUserId(lead.assignedTo)
    ).length;
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

export const useSetFilterByCountry = () => {
  return useLeadsStore((state) => state.setFilterByCountry);
};

export const useSetLeads = () => {
  return useLeadsStore((state) => state.setLeads);
};

export const useSetUsers = () => {
  return useLeadsStore((state) => state.setUsers);
};

export const useSetStatuses = () => {
  return useLeadsStore((state) => state.setStatuses);
};

export const useSetLoadingLeads = () => {
  return useLeadsStore((state) => state.setLoadingLeads);
};

export const useSetLoadingUsers = () => {
  return useLeadsStore((state) => state.setLoadingUsers);
};

export const useSetLoadingStatuses = () => {
  return useLeadsStore((state) => state.setLoadingStatuses);
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

export const useFilterByCountry = () => {
  return useLeadsStore((state) => state.filterByCountry);
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

export const useIsLoadingStatuses = () => {
  return useLeadsStore((state) => state.isLoadingStatuses);
};

// Status hooks
export const useStatuses = () => {
  return useLeadsStore((state) => state.statuses);
};

// Status resolution hook
export const useResolveStatus = () => {
  return useLeadsStore(
    (state) => (statusId: string) => resolveStatusName(statusId, state.statuses)
  );
};

// Computed state hooks
export const useAvailableCountries = () => {
  return useLeadsStore((state) => state.availableCountries);
};

export const useFilteredLeads = () => {
  return useLeadsStore((state) => state.filteredLeads);
};

export const useLeadsCounts = () => {
  return useLeadsStore((state) => ({
    total: state.leads.length,
    filtered: state.filteredLeads.length,
    selected: state.selectedLeads.length,
    countries: state.availableCountries.length,
  }));
};

export const useHasAssignedLeads = () => {
  return useLeadsStore((state) =>
    state.selectedLeads.some((lead) => getAssignedUserId(lead.assignedTo))
  );
};

// Bulk action hooks
export const useSelectAllLeads = () => {
  return useLeadsStore((state) => state.selectAllLeads);
};

export const useDeselectAllLeads = () => {
  return useLeadsStore((state) => state.deselectAllLeads);
};

export const useToggleLeadSelection = () => {
  return useLeadsStore((state) => state.toggleLeadSelection);
};

// Filter action hooks
export const useClearFilters = () => {
  return useLeadsStore((state) => state.clearFilters);
};

export const useClearSelection = () => {
  return useLeadsStore((state) => state.clearSelection);
};
