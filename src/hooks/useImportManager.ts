// src/hooks/useImportManager.ts
import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { ImportHistoryItem, ProcessedLead } from "@/types/import";
import { processFile } from "@/utils/FileProcessing";

interface UsageData {
  currentLeads: number;
  maxLeads: number;
  remainingLeads: number;
  canImport: boolean;
}

interface ImportLimitExceeded {
  attempted: number;
  allowed: number;
  remaining: number;
}

export const useImportManager = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([]);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [importLimitExceeded, setImportLimitExceeded] =
    useState<ImportLimitExceeded | null>(null);

  const waitForImportUpdate = useCallback(
    async (importId: string, maxTries = 10) => {
      for (let i = 0; i < maxTries; i++) {
        const res = await fetch("/api/imports");
        const data = await res.json();
        const record = data.imports.find(
          (imp: ImportHistoryItem) => imp._id === importId
        );
        if (record && record.status !== "new") break;
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    },
    []
  );

  const fetchUsageData = useCallback(async () => {
    try {
      const response = await fetch("/api/usage", {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUsageData(data);
    } catch (error) {
      console.error("Error fetching usage data:", error);
      setUsageData(null);
    }
  }, []);

  const fetchImportHistory = useCallback(async () => {
    try {
      const response = await fetch("/api/imports");
      if (!response.ok) throw new Error("Failed to fetch import history");
      const data = await response.json();
      setImportHistory(data.imports);
    } catch (error) {
      console.error("Error fetching import history:", error);
      setError("Failed to load import history");
    }
  }, []);

  const initializeData = useCallback(async () => {
    setIsInitialLoading(true);
    try {
      await Promise.all([fetchImportHistory(), fetchUsageData()]);
    } catch (error) {
      console.error("Error initializing data:", error);
    } finally {
      setIsInitialLoading(false);
    }
  }, [fetchImportHistory, fetchUsageData]);

  const handleDeleteImport = useCallback(
    async (id: string) => {
      if (
        window.confirm(
          "Are you sure you want to delete this import history records with all leads that were imported? This action cannot be undone."
        )
      ) {
        try {
          const response = await fetch(`/api/imports?id=${id}`, {
            method: "DELETE",
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result?.error || "Failed to delete import record");
          }

          await fetchImportHistory();
          await fetchUsageData();

          toast({
            title: "Success",
            description:
              result?.message || "Import record and leads deleted successfully",
            variant: "success",
          });
        } catch (error) {
          toast({
            title: "Error",
            description:
              error instanceof Error
                ? error.message
                : "Failed to delete import record",
            variant: "destructive",
          });
        }
      }
    },
    [fetchImportHistory, fetchUsageData, toast]
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setError(null);
      setSuccessMessage(null);
      setImportLimitExceeded(null);
      setIsLoading(true);

      const handleSuccess = async (processedLeads: ProcessedLead[]) => {
        // Check usage limits before importing
        if (usageData && !usageData.canImport) {
          setError(
            "Import limit reached. Please upgrade your subscription to import more leads."
          );
          setIsLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
          return;
        }

        // Check if import would exceed limits
        if (
          usageData &&
          usageData.maxLeads !== -1 &&
          usageData.currentLeads + processedLeads.length > usageData.maxLeads
        ) {
          const attempted = processedLeads.length;
          const allowed = usageData.remainingLeads;
          const remaining = usageData.remainingLeads;

          setImportLimitExceeded({
            attempted,
            allowed,
            remaining,
          });

          setError(
            `Import would exceed your lead limit. You can only import ${remaining} more leads, but your file contains ${attempted} leads.`
          );
          setIsLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
          setShowModal(true);
          return;
        }

        try {
          const importResponse = await fetch("/api/imports", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              fileName: file.name,
              recordCount: processedLeads.length,
              status: "New",
              successCount: 0,
              failureCount: 0,
              timestamp: Date.now(),
            }),
          });

          if (!importResponse.ok) {
            const errorData = await importResponse.json();
            if (importResponse.status === 403 && errorData.upgradeRequired) {
              setError(
                errorData.message ||
                  "Import limit reached. Please upgrade your subscription."
              );
              setIsLoading(false);
              if (fileInputRef.current) fileInputRef.current.value = "";
              return;
            }
            throw new Error(
              errorData.message || "Failed to create import record"
            );
          }

          const importData = await importResponse.json();

          const leadsWithImportId = processedLeads.map(
            (lead: ProcessedLead) => ({
              ...lead,
              importId: importData.data._id,
              source:
                lead.source ||
                (file.type === "text/plain" || file.type === "text/csv"
                  ? "paste"
                  : "excel"),
            })
          );

          const leadsResponse = await fetch("/api/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(leadsWithImportId),
          });

          if (!leadsResponse.ok) {
            const errorData = await leadsResponse.json();
            if (leadsResponse.status === 403 && errorData.upgradeRequired) {
              setError(
                errorData.message ||
                  "Import limit reached. Please upgrade your subscription."
              );
              setIsLoading(false);
              if (fileInputRef.current) fileInputRef.current.value = "";
              return;
            }
            throw new Error(errorData.message || "Failed to import leads");
          }

          const result = await leadsResponse.json();
          const successMsg = `Successfully imported ${result.inserted} leads (${result.duplicates} duplicates skipped)`;

          setSuccessMessage(successMsg);

          toast({
            title: "Import Success",
            description: successMsg,
            variant: "success",
          });

          if (usageData) {
            setUsageData({
              ...usageData,
              currentLeads: usageData.currentLeads + result.inserted,
              remainingLeads: Math.max(
                0,
                usageData.remainingLeads - result.inserted
              ),
              canImport:
                usageData.maxLeads === -1 ||
                usageData.currentLeads + result.inserted < usageData.maxLeads,
            });
          }

          await waitForImportUpdate(importData.data._id);
          await fetchImportHistory();
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "An error occurred during import";
          setError(message);
        } finally {
          setIsLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      };

      await processFile(
        file,
        handleSuccess,
        (missing: string[]) => {
          setMissingFields(missing);
          setError(null);
          setShowModal(true);
        },
        (error: unknown) => {
          let errorMessage = "An error occurred";
          if (typeof error === "string") errorMessage = error;
          else if (error instanceof Error) errorMessage = error.message;
          else if (
            typeof error === "object" &&
            error !== null &&
            "message" in error
          ) {
            errorMessage = (error as { message: string }).message;
          }
          setError(errorMessage);
          setMissingFields([]);
          setShowModal(true);
        },
        () => {
          setIsLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      );
    },
    [usageData, waitForImportUpdate, fetchImportHistory, toast]
  );

  // Effects
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      toast({
        title: "Unauthorized Access",
        description: "You do not have permission to view this page.",
        variant: "destructive",
      });
      router.push("/dashboard");
    } else if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, session, router, toast]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      initializeData();
    }
  }, [status, session, initializeData]);

  return {
    // State
    session,
    status,
    fileInputRef,
    isLoading,
    isInitialLoading,
    error,
    successMessage,
    showModal,
    activeTab,
    importHistory,
    missingFields,
    usageData,
    importLimitExceeded,

    // Setters
    setError,
    setSuccessMessage,
    setShowModal,
    setActiveTab,
    setMissingFields,
    setImportLimitExceeded,

    // Handlers
    handleFileUpload,
    handleDeleteImport,
  };
};
