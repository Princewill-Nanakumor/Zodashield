// src/hooks/useLeadDetails.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Lead } from "@/types/leads";

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

  const mutation = useMutation({
    mutationFn: async (updatedLead: Lead): Promise<Lead> => {
      console.log("🔄 Updating lead:", updatedLead._id);
      console.log("📦 Original lead data:", updatedLead);

      // Clean the data - only send fields that can be updated
      // Convert assignedTo to string ID if it's an object
      let assignedToId: string | undefined = undefined;

      if (updatedLead.assignedTo) {
        if (typeof updatedLead.assignedTo === "string") {
          assignedToId = updatedLead.assignedTo;
          console.log("📎 assignedTo is string:", assignedToId);
        } else if (typeof updatedLead.assignedTo === "object") {
          // Try to extract ID from object
          if ("id" in updatedLead.assignedTo && updatedLead.assignedTo.id) {
            assignedToId = String(updatedLead.assignedTo.id);
            console.log("📎 assignedTo.id extracted:", assignedToId);
          } else if (
            "_id" in updatedLead.assignedTo &&
            updatedLead.assignedTo._id
          ) {
            assignedToId = String(updatedLead.assignedTo._id);
            console.log("📎 assignedTo._id extracted:", assignedToId);
          } else {
            console.warn(
              "⚠️ assignedTo is object but has no id or _id:",
              updatedLead.assignedTo
            );
          }
        }
      } else {
        console.log("📎 assignedTo is null/undefined");
      }

      const cleanedData: Record<string, unknown> = {
        firstName: updatedLead.firstName,
        lastName: updatedLead.lastName,
        email: updatedLead.email,
        phone: updatedLead.phone,
        country: updatedLead.country,
        source: updatedLead.source,
        status: updatedLead.status,
        comments: updatedLead.comments,
      };

      // Only include assignedTo if we have a valid ID
      if (assignedToId !== undefined && assignedToId !== null) {
        cleanedData.assignedTo = assignedToId;
      }

      console.log("🧹 Cleaned payload:", JSON.stringify(cleanedData, null, 2));

      const response = await fetch(`/api/leads/${updatedLead._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(cleanedData),
      });

      console.log("📡 Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error response:", errorText);

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }

        console.error("❌ Parsed error:", errorData);
        throw new Error(
          errorData.error || `Failed to update lead (${response.status})`
        );
      }

      const data = await response.json();
      console.log("✅ Lead updated successfully:", data);

      return data;
    },
    onSuccess: (updatedLead) => {
      console.log("✅ onSuccess - Lead updated:", updatedLead);
      console.log("✅ Updating caches with new data...");

      // Immediately update the specific lead in cache (both possible key formats)
      queryClient.setQueryData(["lead", updatedLead._id], updatedLead);
      if (updatedLead.id && updatedLead.id !== updatedLead._id) {
        queryClient.setQueryData(["lead", updatedLead.id], updatedLead);
      }
      console.log("✅ Updated individual lead cache");

      // Update the lead in the all leads list cache
      queryClient.setQueryData(["leads"], (oldData: Lead[] | undefined) => {
        if (!oldData) {
          console.log("⚠️ No data in ['leads'] cache");
          return oldData;
        }
        const updated = oldData.map((lead) =>
          lead._id === updatedLead._id ? updatedLead : lead
        );
        console.log("✅ Updated ['leads'] cache");
        return updated;
      });

      // Update the lead in the all leads list cache (alternative key format)
      queryClient.setQueryData(
        ["leads", "all"],
        (oldData: Lead[] | undefined) => {
          if (!oldData) {
            console.log("⚠️ No data in ['leads', 'all'] cache");
            return oldData;
          }
          const updated = oldData.map((lead) =>
            lead._id === updatedLead._id ? updatedLead : lead
          );
          console.log("✅ Updated ['leads', 'all'] cache");
          return updated;
        }
      );

      // Update assigned leads cache
      queryClient.setQueryData(
        ["leads", "assigned"],
        (oldData: Lead[] | undefined) => {
          if (!oldData) {
            console.log("⚠️ No data in ['leads', 'assigned'] cache");
            return oldData;
          }
          const updated = oldData.map((lead) =>
            lead._id === updatedLead._id ? updatedLead : lead
          );
          console.log("✅ Updated ['leads', 'assigned'] cache");
          return updated;
        }
      );

      console.log("✅ All caches updated successfully");

      // Don't show toast here - let the component handle it
    },
    onError: (error) => {
      console.error("❌ onError - Error updating lead:", error);

      // Don't show toast here - let the component handle it
      // The error will be caught by the component's try-catch
    },
  });

  return {
    updateLead: mutation.mutate,
    updateLeadAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
};
