// src/hooks/useLeadDetails.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Lead } from "@/types/leads";
import { useToast } from "@/components/ui/use-toast";

/**
 * Hook to fetch a single lead by ID using React Query
 */
export const useLeadDetails = (leadId: string | null | undefined) => {
  const {
    data: lead,
    isLoading,
    error,
    refetch,
  } = useQuery<Lead, Error>({
    queryKey: ["lead", leadId],
    queryFn: async (): Promise<Lead> => {
      if (!leadId) {
        throw new Error("Lead ID is required");
      }

      console.log("🔍 Fetching lead with ID:", leadId);

      const response = await fetch(`/api/leads/${leadId}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ API Error:", response.status, errorData);
        throw new Error(
          errorData.error || `Failed to fetch lead: ${response.status}`
        );
      }

      const leadData = await response.json();
      console.log("✅ Lead data received:", leadData);

      return leadData;
    },
    enabled: !!leadId, // Only run query if leadId exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    retry: 2,
  });

  return {
    lead,
    isLoading,
    error: error?.message || null,
    refetch,
  };
};

/**
 * Hook to update a lead using React Query mutation
 */
export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async (updatedLead: Lead): Promise<Lead> => {
      console.log("🔄 Updating lead:", updatedLead._id);

      const response = await fetch(`/api/leads/${updatedLead._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updatedLead),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update lead");
      }

      const data = await response.json();
      console.log("✅ Lead updated successfully:", data);

      return data;
    },
    onSuccess: (updatedLead) => {
      // Update the specific lead in cache
      queryClient.setQueryData(["lead", updatedLead._id], updatedLead);

      // Invalidate and refetch all leads lists
      queryClient.invalidateQueries({ queryKey: ["leads"] });

      // Optionally invalidate assigned leads
      queryClient.invalidateQueries({ queryKey: ["leads", "assigned"] });

      toast({
        title: "Success",
        description: "Lead updated successfully",
      });
    },
    onError: (error) => {
      console.error("❌ Error updating lead:", error);

      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update lead",
        variant: "destructive",
      });
    },
  });

  return {
    updateLead: mutation.mutate,
    updateLeadAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
};
