"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useTransition,
} from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Lead, LeadSource } from "@/types/leads";
import { TablePagination } from "@/components/leads/TablePagination";
import LeadDetailsPanel from "@/components/dashboardComponents/LeadDetailsPanel";
import { UserLeadTable } from "@/components/user-leads/UserLeadTable";
import { UserLeadTableControls } from "@/components/user-leads/UserLeadTableControls";
import { UserLeadsHeader } from "@/components/leads/UserLeadsHeader";
import { UserLeadsFilterControls } from "@/components/leads/UserLeadsFilterControls";
import {
  LoadingSpinner,
  TableSkeleton,
} from "@/components/leads/UserLeadsLoadingStates";

interface LeadFromAPI {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  country?: string;
  value?: number;
  source: LeadSource;
  status: string;
  comments?: string;
  assignedAt?: string;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_PAGE_SIZE = 10;

type SortField = "name" | "country" | "status" | "source" | "createdAt";
type SortOrder = "asc" | "desc";

// Custom debounce function with proper typing
const debounce = <T extends (...args: never[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Optimized filter functions
const filterLeadsByCountry = (
  leads: Lead[],
  filterByCountry: string
): Lead[] => {
  if (!filterByCountry || filterByCountry === "all") return leads;
  return leads.filter(
    (lead) => lead.country?.toLowerCase() === filterByCountry.toLowerCase()
  );
};

export default function UserLeadsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(0);

  // URL-synced filters
  const sortField = (searchParams.get("sortField") as SortField) || "createdAt";
  const sortOrder = (searchParams.get("sortOrder") as SortOrder) || "desc";
  const [filterByCountry, setFilterByCountry] = useState<string>(() => {
    return searchParams.get("country") || "all";
  });

  // URL sync for country filter
  useEffect(() => {
    const urlCountry = searchParams.get("country");
    if (urlCountry && urlCountry !== filterByCountry) {
      setFilterByCountry(urlCountry);
    }
  }, [searchParams, filterByCountry]);

  // Debounced country filter change
  const debouncedCountryFilterChange = useMemo(
    () =>
      debounce((country: string) => {
        const params = new URLSearchParams(searchParams);
        if (country === "all") {
          params.delete("country");
        } else {
          params.set("country", country);
        }
        router.push(`?${params.toString()}`, { scroll: false });
      }, 300),
    [searchParams, router]
  );

  // Optimized available countries with memoization
  const availableCountries = useMemo(() => {
    if (!isDataReady) return [];

    const countrySet = new Set<string>();
    leads.forEach((lead) => {
      if (lead.country?.trim()) {
        countrySet.add(lead.country.toLowerCase());
      }
    });

    return Array.from(countrySet).sort();
  }, [leads, isDataReady]);

  // Optimized filtered leads
  const filteredLeads = useMemo(() => {
    if (!isDataReady) return [];
    return filterLeadsByCountry(leads, filterByCountry);
  }, [leads, filterByCountry, isDataReady]);

  // Memoized sorted leads with early return
  const sortedLeads = useMemo(() => {
    if (!isDataReady || filteredLeads.length === 0) return [];

    return [...filteredLeads].sort((a, b) => {
      const multiplier = sortOrder === "asc" ? 1 : -1;
      switch (sortField) {
        case "name":
          return (
            `${a.firstName} ${a.lastName}`.localeCompare(
              `${b.firstName} ${b.lastName}`
            ) * multiplier
          );
        case "country":
          return (a.country || "").localeCompare(b.country || "") * multiplier;
        case "status":
          return (a.status || "").localeCompare(b.status || "") * multiplier;
        case "source":
          return a.source.localeCompare(b.source) * multiplier;
        case "createdAt":
          return (
            (new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime()) *
            multiplier
          );
        default:
          return 0;
      }
    });
  }, [filteredLeads, sortField, sortOrder, isDataReady]);

  // Memoized paginated leads with bounds checking
  const paginatedLeads = useMemo(() => {
    if (!isDataReady || sortedLeads.length === 0) return [];

    const startIndex = pageIndex * pageSize;
    const endIndex = startIndex + pageSize;

    // Reset page if current page is out of bounds
    if (startIndex >= sortedLeads.length && pageIndex > 0) {
      const newPageIndex = Math.floor((sortedLeads.length - 1) / pageSize);
      setPageIndex(newPageIndex);
      return sortedLeads.slice(
        newPageIndex * pageSize,
        (newPageIndex + 1) * pageSize
      );
    }

    return sortedLeads.slice(startIndex, endIndex);
  }, [sortedLeads, pageIndex, pageSize, isDataReady]);

  // Optimized counts calculation
  const counts = useMemo(() => {
    if (!isDataReady) {
      return {
        total: 0,
        filtered: 0,
        currentPage: 0,
        totalPages: 0,
        countries: 0,
      };
    }

    return {
      total: leads.length,
      filtered: filteredLeads.length,
      currentPage: paginatedLeads.length,
      totalPages: Math.ceil(filteredLeads.length / pageSize),
      countries: availableCountries.length,
    };
  }, [
    leads.length,
    filteredLeads.length,
    paginatedLeads.length,
    pageSize,
    availableCountries.length,
    isDataReady,
  ]);

  // Determine if we should show loading states
  const shouldShowLoading = loading && leads.length === 0;

  // Set data ready state when initial load completes
  useEffect(() => {
    if (!loading) {
      setIsDataReady(true);
    }
  }, [loading]);

  // Reset data ready state when starting a new load
  useEffect(() => {
    if (loading) {
      setIsDataReady(false);
    }
  }, [loading]);

  // Optimized lead selection effect
  useEffect(() => {
    const leadId = searchParams.get("lead");
    if (leadId && isDataReady) {
      const lead = filteredLeads.find((l) => l._id === leadId);
      if (lead) {
        setSelectedLead(lead);
        setIsPanelOpen(true);
      } else {
        setIsPanelOpen(false);
        setSelectedLead(null);
      }
    } else {
      setIsPanelOpen(false);
      setSelectedLead(null);
    }
  }, [filteredLeads, searchParams, isDataReady]);

  // Optimized handlers with useTransition
  const handleLeadClick = useCallback(
    (lead: Lead) => {
      if (lead?._id) {
        startTransition(() => {
          const params = new URLSearchParams(searchParams);
          params.set("lead", lead._id);
          params.set("name", `${lead.firstName}-${lead.lastName}`);
          router.push(`?${params.toString()}`, { scroll: false });
        });
      }
    },
    [searchParams, router, startTransition]
  );

  const handlePanelClose = useCallback(() => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      params.delete("lead");
      params.delete("name");
      router.push(`?${params.toString()}`, { scroll: false });
    });
    setIsPanelOpen(false);
    setSelectedLead(null);
  }, [searchParams, router, startTransition]);

  const handleNavigate = useCallback(
    (direction: "prev" | "next") => {
      if (!selectedLead || !isDataReady) return;

      const index = sortedLeads.findIndex(
        (lead) => lead._id === selectedLead._id
      );
      const newIndex = direction === "prev" ? index - 1 : index + 1;
      if (newIndex >= 0 && newIndex < sortedLeads.length) {
        const newLead = sortedLeads[newIndex];
        startTransition(() => {
          const params = new URLSearchParams(searchParams);
          params.set("lead", newLead._id);
          params.set("name", `${newLead.firstName}-${newLead.lastName}`);
          router.push(`?${params.toString()}`, { scroll: false });
        });
      }
    },
    [
      selectedLead,
      sortedLeads,
      searchParams,
      router,
      isDataReady,
      startTransition,
    ]
  );

  const handleCountryFilterChange = useCallback(
    (country: string) => {
      setFilterByCountry(country);
      setPageIndex(0); // Reset to first page when filtering
      debouncedCountryFilterChange(country);
    },
    [debouncedCountryFilterChange]
  );

  const fetchLeads = useCallback(async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const res = await fetch("/api/leads/assigned", {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch leads");

      const data = await res.json();
      const transformed: Lead[] = (data.assignedLeads || []).map(
        (lead: LeadFromAPI) => ({
          _id: lead._id,
          name: `${lead.firstName} ${lead.lastName}`,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          country: lead.country,
          value: lead.value,
          source: lead.source,
          status: lead.status,
          comments: lead.comments,
          assignedAt: lead.assignedAt,
          assignedTo: {
            id: session.user.id,
            firstName: session.user.firstName || "",
            lastName: session.user.lastName || "",
          },
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt,
        })
      );

      setLeads(transformed);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [session?.user, toast]);

  const handleLeadUpdated = useCallback(
    async (updatedLead: Lead) => {
      setLeads((prevLeads) =>
        prevLeads.map((lead) =>
          lead._id === updatedLead._id ? updatedLead : lead
        )
      );
      if (selectedLead?._id === updatedLead._id) {
        setSelectedLead(updatedLead);
      }
      return true;
    },
    [selectedLead?._id]
  );

  const handleSort = useCallback(
    (field: SortField) => {
      const newOrder =
        sortField === field && sortOrder === "asc" ? "desc" : "asc";
      startTransition(() => {
        const params = new URLSearchParams(searchParams);
        params.set("sortField", field);
        params.set("sortOrder", newOrder);
        router.push(`?${params.toString()}`, { scroll: false });
      });
    },
    [sortField, sortOrder, searchParams, router, startTransition]
  );

  const handlePageSizeChange = useCallback((value: string) => {
    setPageSize(parseInt(value));
    setPageIndex(0);
  }, []);

  const handlePageChange = useCallback((newPageIndex: number) => {
    setPageIndex(newPageIndex);
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (session?.user) {
      fetchLeads();
    }
  }, [status, session, router, fetchLeads]);

  const currentIndex =
    selectedLead && isDataReady
      ? sortedLeads.findIndex((lead) => lead._id === selectedLead._id)
      : -1;

  if (status === "loading") {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <UserLeadsHeader shouldShowLoading={shouldShowLoading} counts={counts} />

      {/* Filter Controls */}
      <UserLeadsFilterControls
        shouldShowLoading={shouldShowLoading}
        filterByCountry={filterByCountry}
        onCountryFilterChange={handleCountryFilterChange}
        availableCountries={availableCountries}
        counts={counts}
      />

      {/* Main Content */}
      {shouldShowLoading ? (
        <TableSkeleton />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <UserLeadTableControls
            pageSize={pageSize}
            pageIndex={pageIndex}
            totalEntries={counts.filtered}
            onPageSizeChange={handlePageSizeChange}
          />

          <UserLeadTable
            loading={loading || isPending}
            paginatedLeads={paginatedLeads}
            onLeadClick={handleLeadClick}
            selectedLead={selectedLead}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
          />

          {counts.filtered > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700">
              <TablePagination
                pageIndex={pageIndex}
                pageCount={counts.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      )}

      {/* Lead Details Panel */}
      {isPanelOpen && selectedLead && isDataReady && (
        <LeadDetailsPanel
          lead={selectedLead}
          isOpen={isPanelOpen}
          onClose={handlePanelClose}
          onLeadUpdated={handleLeadUpdated}
          onNavigate={handleNavigate}
          hasPrevious={currentIndex > 0}
          hasNext={currentIndex < sortedLeads.length - 1}
        />
      )}
    </div>
  );
}
