"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Lead, LeadSource } from "@/types/leads";
import { TablePagination } from "@/components/leads/TablePagination";
import LeadDetailsPanel from "@/components/dashboardComponents/LeadDetailsPanel";
import { UserLeadTable } from "@/components/user-leads/UserLeadTable";
import { UserLeadTableControls } from "@/components/user-leads/UserLeadTableControls";
import { StatusProvider } from "@/context/StatusContext";
import { Loader2 } from "lucide-react";

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

function UserLeadsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageIndex, setPageIndex] = useState(0);

  const sortField = (searchParams.get("sortField") as SortField) || "createdAt";
  const sortOrder = (searchParams.get("sortOrder") as SortOrder) || "desc";

  useEffect(() => {
    const leadId = searchParams.get("lead");
    if (leadId) {
      const lead = leads.find((l) => l._id === leadId);
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
  }, [leads, searchParams]);

  const handleLeadClick = (lead: Lead) => {
    if (lead?._id) {
      const params = new URLSearchParams(searchParams);
      params.set("lead", lead._id);
      params.set("name", `${lead.firstName}-${lead.lastName}`);
      router.push(`?${params.toString()}`, { scroll: false });
    }
  };

  const handlePanelClose = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("lead");
    params.delete("name");
    router.push(`?${params.toString()}`, { scroll: false });
    setIsPanelOpen(false);
    setSelectedLead(null);
  };

  const handleNavigate = (direction: "prev" | "next") => {
    if (!selectedLead) return;
    const index = sortedLeads.findIndex(
      (lead) => lead._id === selectedLead._id
    );
    const newIndex = direction === "prev" ? index - 1 : index + 1;
    if (newIndex >= 0 && newIndex < sortedLeads.length) {
      const newLead = sortedLeads[newIndex];
      const params = new URLSearchParams(searchParams);
      params.set("lead", newLead._id);
      params.set("name", `${newLead.firstName}-${newLead.lastName}`);
      router.push(`?${params.toString()}`, { scroll: false });
    }
  };

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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (session?.user) {
      fetchLeads();
    }
  }, [status, session, router, fetchLeads]);

  const sortedLeads = [...leads].sort((a, b) => {
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
          (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) *
          multiplier
        );
      default:
        return 0;
    }
  });

  const paginatedLeads = sortedLeads.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize
  );

  const currentIndex = selectedLead
    ? sortedLeads.findIndex((lead) => lead._id === selectedLead._id)
    : -1;

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-12 w-12 animate-spin text-gray-500 dark:text-gray-400" />
      </div>
    );
  }

  const handleSort = (field: SortField) => {
    const newOrder =
      sortField === field && sortOrder === "asc" ? "desc" : "asc";
    const params = new URLSearchParams(searchParams);
    params.set("sortField", field);
    params.set("sortOrder", newOrder);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            My Leads
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            View and manage your assigned leads
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <UserLeadTableControls
          pageSize={pageSize}
          pageIndex={pageIndex}
          totalEntries={leads.length}
          onPageSizeChange={(value) => {
            setPageSize(parseInt(value));
            setPageIndex(0);
          }}
        />

        <UserLeadTable
          loading={loading}
          paginatedLeads={paginatedLeads}
          onLeadClick={handleLeadClick}
          selectedLead={selectedLead}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
        />

        <div className="border-t border-gray-200 dark:border-gray-700">
          <TablePagination
            pageIndex={pageIndex}
            pageCount={Math.ceil(leads.length / pageSize)}
            onPageChange={setPageIndex}
          />
        </div>
      </div>

      {isPanelOpen && selectedLead && (
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

export default function UserLeadsPage() {
  return (
    <StatusProvider>
      <UserLeadsContent />
    </StatusProvider>
  );
}
