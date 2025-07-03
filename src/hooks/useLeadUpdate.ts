// src/hooks/useLeadUpdate.ts
import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Lead } from "@/types/leads";

export const useLeadUpdate = (
  displayLeads: Lead[],
  setLeads: (leads: Lead[]) => void
) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleLeadUpdate = useCallback(
    async (updatedLead: Lead): Promise<boolean> => {
      try {
        setIsUpdating(true);

        const originalLead = displayLeads.find(
          (l) => l._id === updatedLead._id
        );
        if (!originalLead) {
          throw new Error("Original lead not found");
        }

        const hasStatusChange = updatedLead.status !== originalLead.status;
        const hasOtherChanges =
          updatedLead.firstName !== originalLead.firstName ||
          updatedLead.lastName !== originalLead.lastName ||
          updatedLead.email !== originalLead.email ||
          updatedLead.phone !== originalLead.phone ||
          updatedLead.source !== originalLead.source ||
          updatedLead.country !== originalLead.country ||
          updatedLead.comments !== originalLead.comments ||
          JSON.stringify(updatedLead.assignedTo) !==
            JSON.stringify(originalLead.assignedTo);

        if (hasStatusChange && !hasOtherChanges) {
          console.log("Status-only update detected, updating state only");
          const updatedLeads = displayLeads.map((lead) =>
            lead._id === updatedLead._id ? updatedLead : lead
          );
          setLeads(updatedLeads);
          return true;
        }

        const updateData: Record<string, unknown> = {
          ...(updatedLead.firstName !== originalLead.firstName && {
            firstName: updatedLead.firstName,
          }),
          ...(updatedLead.lastName !== originalLead.lastName && {
            lastName: updatedLead.lastName,
          }),
          ...(updatedLead.email !== originalLead.email && {
            email: updatedLead.email,
          }),
          ...(updatedLead.phone !== originalLead.phone && {
            phone: updatedLead.phone,
          }),
          ...(updatedLead.source !== originalLead.source && {
            source: updatedLead.source,
          }),
          ...(updatedLead.status !== originalLead.status && {
            status: updatedLead.status,
          }),
          ...(updatedLead.country !== originalLead.country && {
            country: updatedLead.country,
          }),
          ...(updatedLead.comments !== originalLead.comments && {
            comments: updatedLead.comments,
          }),
          ...(updatedLead.assignedTo !== originalLead.assignedTo && {
            assignedTo:
              typeof updatedLead.assignedTo === "string"
                ? updatedLead.assignedTo
                : updatedLead.assignedTo?.id || null,
          }),
          updatedAt: new Date().toISOString(),
        };

        Object.keys(updateData).forEach(
          (key) => updateData[key] === undefined && delete updateData[key]
        );

        if (Object.keys(updateData).length > 1) {
          const response = await fetch(`/api/leads/${updatedLead._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("API Error:", errorData);
            throw new Error(
              errorData.error || errorData.message || "Failed to update lead"
            );
          }

          const result = await response.json();
          console.log("Update successful:", result);

          queryClient.invalidateQueries({ queryKey: ["leads"] });

          toast({
            title: "Success",
            description: "Lead updated successfully",
            variant: "success",
          });
        }

        return true;
      } catch (error) {
        console.error("Error updating lead:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to update lead",
          variant: "destructive",
        });
        return false;
      } finally {
        setIsUpdating(false);
      }
    },
    [displayLeads, queryClient, toast, setLeads]
  );

  return {
    handleLeadUpdate,
    isUpdating,
  };
};

// Default export
export default useLeadUpdate;
