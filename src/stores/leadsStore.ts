import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
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

  // Computed
  filteredLeads: Lead[];
  assignedLeadsCount: number;
}

export const useLeadsStore = create<LeadsState>()(
  devtools(
    persist(
      (set, get) => ({
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

        // Computed
        get filteredLeads() {
          const { leads, filterByUser } = get();
          if (filterByUser === "unassigned") {
            return leads.filter((lead) => !lead.assignedTo);
          }
          if (filterByUser === "all") {
            return leads;
          }
          return leads.filter((lead) => {
            if (!lead.assignedTo) return false;

            // Check if assignedTo is a string or object
            if (typeof lead.assignedTo === "string") {
              return lead.assignedTo === filterByUser;
            }

            // If it's an object, check the id property
            return lead.assignedTo.id === filterByUser;
          });
        },

        get assignedLeadsCount() {
          const { selectedLeads } = get();
          return selectedLeads.filter((lead) => lead.assignedTo).length;
        },
      }),
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
