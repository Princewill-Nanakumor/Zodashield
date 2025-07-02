"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

import { ImportHistoryItem, ProcessedLead } from "@/types/import";
import { ImportModal } from "@/components/dashboardComponents/ImportModal";
import { processFile } from "@/utils/FileProcessing";
import { ImportTabs } from "@/components/dashboardComponents/ImportTabs";
import { SampleDataBanner } from "@/components/dashboardComponents/SampleDataBanner";
import { ImportContent } from "@/components/dashboardComponents/ImportContent";
import FileUploadSection from "@/components/dashboardComponents/FileUploadSection";
import { HelpSection } from "@/components/dashboardComponents/HelpSection";

export default function ImportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>([]);
  const [missingFields, setMissingFields] = useState<string[]>([]);

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
      fetchImportHistory();
    }
  }, [status, session]);

  const fetchImportHistory = async () => {
    try {
      const response = await fetch("/api/imports");
      if (!response.ok) throw new Error("Failed to fetch import history");
      const data = await response.json();
      setImportHistory(data.imports);
    } catch (error) {
      console.error("Error fetching import history:", error);
      setError("Failed to load import history");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    const handleSuccess = async (processedLeads: ProcessedLead[]) => {
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
          throw new Error("Failed to create import record");
        }

        const importData = await importResponse.json();

        const leadsWithImportId = processedLeads.map((lead: ProcessedLead) => ({
          ...lead,
          importId: importData.data._id,
          source:
            lead.source ||
            (file.type === "text/plain" || file.type === "text/csv"
              ? "paste"
              : "excel"),
        }));

        const leadsResponse = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(leadsWithImportId),
        });

        if (!leadsResponse.ok) {
          throw new Error("Failed to import leads");
        }

        const result = await leadsResponse.json();
        setSuccessMessage(
          `Successfully imported ${result.inserted} leads (${result.duplicates} duplicates skipped)`
        );

        await fetchImportHistory();

        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "An error occurred during import";
        toast({
          title: "Import Error",
          description: message,
          variant: "destructive",
        });
        setError(message);
      } finally {
        setIsLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };

    await processFile(
      file,
      handleSuccess,
      (missing: string[]) => {
        setMissingFields(missing);
        setShowModal(true);
      },
      (error: unknown) => {
        if (
          typeof error === "object" &&
          error !== null &&
          "type" in error &&
          (error as { type?: string }).type === "NO_VALID_LEADS"
        ) {
          const msg =
            (error as { message?: string }).message ||
            "No valid leads found in file.";
          setError(msg);
          setShowModal(true);
        } else if (
          typeof error === "object" &&
          error !== null &&
          "message" in error
        ) {
          setError(
            (error as { message?: string }).message || "An error occurred"
          );
        } else {
          setError("An error occurred");
        }
      },
      () => {
        setIsLoading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    );
  };

  const handleDeleteImport = async (id: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this import history record?"
      )
    ) {
      try {
        const response = await fetch(`/api/imports?id=${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete import record");
        }

        await fetchImportHistory();
      } catch (error) {
        console.error("Delete failed:", error);
        setError("Failed to delete import record");
      }
    }
  };

  if (status === "loading") return <div>Loading...</div>;
  if (!session || session.user.role !== "ADMIN") return null;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 ">
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-8">
          <SampleDataBanner />
          <div className="bg-white dark:text-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <ImportContent />
            <ImportTabs activeTab={activeTab} setActiveTab={setActiveTab} />
            <FileUploadSection
              activeTab={activeTab}
              fileInputRef={fileInputRef}
              isLoading={isLoading}
              error={error}
              successMessage={successMessage}
              handleFileUpload={handleFileUpload}
              importHistory={importHistory}
              onDelete={handleDeleteImport}
              setShowModal={setShowModal}
              missingFields={missingFields}
            />
            <ImportModal
              isOpen={showModal}
              onClose={() => {
                setShowModal(false);
                setError(null);
                setMissingFields([]);
              }}
              missingFields={missingFields}
              errorMessage={error ?? undefined}
            />
            <HelpSection />
          </div>
        </div>
      </div>
    </div>
  );
}
