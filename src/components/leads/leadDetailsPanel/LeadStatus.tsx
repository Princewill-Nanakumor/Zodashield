"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Lead } from "@/types/leads";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useStatuses } from "@/context/StatusContext";

interface LeadStatusProps {
  lead: Lead;
  onLeadUpdated?: (updatedLead: Lead) => Promise<boolean>;
}

type LeadsData =
  | Lead[]
  | {
      data: Lead[];
      total?: number;
      page?: number;
      [key: string]: unknown;
    }
  | {
      leads: Lead[];
      [key: string]: unknown;
    }
  | null
  | undefined;

function hexWithAlpha(hex: string, alpha: string) {
  if (!hex) return "#3b82f6" + alpha;
  if (hex.length === 7) return hex + alpha;
  if (hex.length === 4)
    return "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3] + alpha;
  return hex + alpha;
}

const LeadStatus: React.FC<LeadStatusProps> = ({ lead, onLeadUpdated }) => {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>(lead.status);
  const queryClient = useQueryClient();
  const { statuses, isLoading: isLoadingStatuses } = useStatuses();
  const darkAlpha = "B3";
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const match = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(match.matches);
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    match.addEventListener("change", handler);
    return () => match.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (lead.status !== currentStatus) {
      setCurrentStatus(lead.status);
    }
  }, [lead.status, currentStatus, lead._id]);

  const findStatusByIdOrName = useCallback(
    (statusId: string) => {
      let status = statuses.find((s) => s._id === statusId);
      if (!status) {
        status = statuses.find((s) => s.id === statusId);
      }
      if (!status) {
        status = statuses.find((s) => s.name === statusId);
      }
      return status;
    },
    [statuses]
  );

  const currentStatusObj = findStatusByIdOrName(currentStatus);

  const getStatusDisplayName = useCallback(
    (statusId: string) => {
      const status = findStatusByIdOrName(statusId);
      if (status) {
        return status.name;
      }
      return statusId || "Unknown";
    },
    [findStatusByIdOrName]
  );

  const handleStatusChange = useCallback(
    async (newStatusId: string) => {
      if (!lead._id || currentStatus === newStatusId) return;

      const previousStatus = currentStatus;
      setCurrentStatus(newStatusId);
      setIsUpdating(true);

      queryClient.setQueryData(["leads"], (oldData: LeadsData) => {
        if (!oldData) return oldData;

        if (Array.isArray(oldData)) {
          return oldData.map((l: Lead) =>
            l._id === lead._id ? { ...l, status: newStatusId } : l
          );
        } else if (oldData && typeof oldData === "object") {
          if ("data" in oldData && Array.isArray(oldData.data)) {
            return {
              ...oldData,
              data: oldData.data.map(
                (l: Lead) =>
                  l._id === lead._id ? { ...l, status: newStatusId } : l // ✅ FIXED
              ),
            };
          } else if ("leads" in oldData && Array.isArray(oldData.leads)) {
            return {
              ...oldData,
              leads: oldData.leads.map(
                (l: Lead) =>
                  l._id === lead._id ? { ...l, status: newStatusId } : l // ✅ FIXED
              ),
            };
          }
        }
        return oldData;
      });

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`/api/leads/${lead._id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatusId }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to update status: ${response.status} - ${errorText}`
          );
        }

        const updatedLead = await response.json();
        setCurrentStatus(updatedLead.status);

        if (updatedLead.status !== newStatusId) {
          queryClient.setQueryData(["leads"], (oldData: LeadsData) => {
            if (!oldData) return oldData;

            if (Array.isArray(oldData)) {
              return oldData.map((l: Lead) =>
                l._id === lead._id ? updatedLead : l
              );
            } else if (oldData && typeof oldData === "object") {
              if ("data" in oldData && Array.isArray(oldData.data)) {
                return {
                  ...oldData,
                  data: oldData.data.map((l: Lead) =>
                    l._id === lead._id ? updatedLead : l
                  ),
                };
              } else if ("leads" in oldData && Array.isArray(oldData.leads)) {
                return {
                  ...oldData,
                  leads: oldData.leads.map((l: Lead) =>
                    l._id === lead._id ? updatedLead : l
                  ),
                };
              }
            }
            return oldData;
          });
        }

        if (onLeadUpdated) {
          onLeadUpdated(updatedLead).catch((error) => {
            console.error("Error in onLeadUpdated:", error);
          });
        }

        queryClient
          .invalidateQueries({
            queryKey: ["leads"],
            exact: false,
          })
          .catch((error) => {
            console.error("Error invalidating queries:", error);
          });

        toast({
          title: "Status updated",
          description: `Lead status changed successfully.`,
          variant: "success",
        });
      } catch (error) {
        setCurrentStatus(previousStatus);

        // ✅ FIXED: Use previousStatus for rollback (this was correct)
        queryClient.setQueryData(["leads"], (oldData: LeadsData) => {
          if (!oldData) return oldData;

          if (Array.isArray(oldData)) {
            return oldData.map((l: Lead) =>
              l._id === lead._id ? { ...l, status: previousStatus } : l
            );
          } else if (oldData && typeof oldData === "object") {
            if ("data" in oldData && Array.isArray(oldData.data)) {
              return {
                ...oldData,
                data: oldData.data.map((l: Lead) =>
                  l._id === lead._id ? { ...l, status: previousStatus } : l
                ),
              };
            } else if ("leads" in oldData && Array.isArray(oldData.leads)) {
              return {
                ...oldData,
                leads: oldData.leads.map((l: Lead) =>
                  l._id === lead._id ? { ...l, status: previousStatus } : l
                ),
              };
            }
          }
          return oldData;
        });

        const errorMessage =
          error instanceof Error ? error.message : "Failed to update status";

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsUpdating(false);
      }
    },
    [lead._id, currentStatus, onLeadUpdated, queryClient, toast]
  );

  const currentStatusColor = currentStatusObj?.color || "#3b82f6";
  const triggerBg = isDark
    ? hexWithAlpha(currentStatusColor, darkAlpha)
    : currentStatusColor;
  const triggerTextColor = "#fff";
  const maxHeight = statuses.length > 7 ? "280px" : "auto";

  return (
    <div className="flex items-center">
      <style jsx>{`
        .smooth-scroll-content {
          scroll-behavior: smooth;
          scrollbar-width: thin;
          scrollbar-color: ${isDark ? "#6b7280 #374151" : "#cbd5e1 #f1f5f9"};
        }

        .smooth-scroll-content::-webkit-scrollbar {
          width: 8px;
        }

        .smooth-scroll-content::-webkit-scrollbar-track {
          background: ${isDark ? "#374151" : "#f1f5f9"};
          border-radius: 4px;
        }

        .smooth-scroll-content::-webkit-scrollbar-thumb {
          background: ${isDark ? "#6b7280" : "#94a3b8"};
          border-radius: 4px;
          transition: background-color 0.2s ease;
        }

        .smooth-scroll-content::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? "#9ca3af" : "#94a3b8"};
        }

        .status-item {
          transition: all 0.2s ease-in-out;
        }

        .status-item:hover {
          transform: translateX(2px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>

      <div className="flex-1">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</p>
        {isLoadingStatuses ? (
          <div className="flex items-center">
            <Loader2 className="h-4 w-4 animate-spin text-gray-500 dark:text-gray-400" />
          </div>
        ) : (
          <Select
            value={currentStatus}
            onValueChange={handleStatusChange}
            disabled={isUpdating}
          >
            <SelectTrigger
              className="w-[200px] border rounded-md cursor-pointer dark:border-gray-600 transition-all duration-200 ease-in-out"
              style={{
                backgroundColor: triggerBg,
                color: triggerTextColor,
                borderColor: currentStatusColor,
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full transition-all duration-200 ease-in-out"
                  style={{
                    backgroundColor: "#fff",
                    border: `2px solid ${currentStatusColor}`,
                  }}
                />
                <span
                  className="font-medium"
                  style={{
                    color: triggerTextColor,
                  }}
                >
                  {getStatusDisplayName(currentStatus)}
                </span>
                {isUpdating && (
                  <Loader2
                    className="h-3 w-3 animate-spin ml-auto"
                    style={{ color: triggerTextColor }}
                  />
                )}
              </div>
            </SelectTrigger>
            <SelectContent
              className={`border-gray-300 dark:border-gray-600 ${
                statuses.length > 7 ? "smooth-scroll-content" : ""
              }`}
              style={{
                maxHeight: maxHeight,
                overflowY: statuses.length > 7 ? "auto" : "visible",
                scrollBehavior: "smooth",
              }}
            >
              {statuses.map((status) => {
                const statusColor = status.color || "#3b82f6";
                const itemBg = isDark
                  ? hexWithAlpha(statusColor, darkAlpha)
                  : statusColor;
                const textColor = "#fff";
                return (
                  <SelectItem
                    key={status._id || status.id || `status-${status.name}`}
                    value={status._id || status.id || ""}
                    className="status-item my-1 rounded-md transition-all duration-200 ease-in-out font-medium cursor-pointer"
                    style={{
                      backgroundColor: itemBg,
                      color: textColor,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full transition-all duration-200 ease-in-out"
                        style={{
                          backgroundColor: "#fff",
                          border: `2px solid ${statusColor}`,
                        }}
                      />
                      <span style={{ color: textColor }}>{status.name}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};

export default LeadStatus;
