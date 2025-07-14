// src/components/user-leads/LeadDataManager.tsx
"use client";

import { useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/use-toast";
import { Lead, LeadSource } from "@/types/leads";

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

interface LeadDataManagerProps {
  onLeadsLoaded: (leads: Lead[]) => void;
  onLoadingChange: (loading: boolean) => void;
  children: React.ReactNode;
}

export function LeadDataManager({
  onLeadsLoaded,
  onLoadingChange,
  children,
}: LeadDataManagerProps) {
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const fetchLeads = useCallback(async () => {
    if (!session?.user?.id) return;

    onLoadingChange(true);
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

      onLeadsLoaded(transformed);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      onLoadingChange(false);
    }
  }, [session?.user, toast, onLeadsLoaded, onLoadingChange]);

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      fetchLeads();
    }
  }, [status, session, fetchLeads]);

  return <>{children}</>;
}
