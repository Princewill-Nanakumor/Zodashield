// src/components/dashboardComponents/ImportManager.tsx
"use client";

import { Loader2 } from "lucide-react";
import FileUploadSection from "../importPageComponents/FileUploadSection";
import { HelpSection } from "../importPageComponents/HelpSection";
import { ImportTabs } from "../importPageComponents/ImportTabs";
import { ImportContent } from "../importPageComponents/ImportContent";
import { UsageLimitsDisplay } from "@/components/importPageComponents/UsageLimitsDisplay";
import { UsageLimitsSkeleton } from "@/components/importPageComponents/UsageLimitsSkeleton";
import { ImportHistorySection } from "@/components/importPageComponents/ImportHistorySection";
import { ImportModalWrapper } from "@/components/importPageComponents/ImportModalWrapper";
import { useImportManager } from "@/hooks/useImportManager";
import { useUsageData } from "@/hooks/useUsageData";

export const ImportManager = () => {
  const {
    session,
    status,
    fileInputRef,
    isLoading,
    error,
    successMessage,
    showModal,
    activeTab,
    importHistory,
    missingFields,
    importLimitExceeded,
    setError,
    setShowModal,
    setActiveTab,
    setMissingFields,
    setImportLimitExceeded,
    handleFileUpload,
    handleDeleteImport,
  } = useImportManager();

  // Use the new usage data hook
  const { usageData, isLoading: isUsageLoading } = useUsageData();

  // Show loading spinner only when session is loading
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!session || session.user.role !== "ADMIN") return null;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-800 rounded">
      <div className="flex-1 flex flex-col">
        <div className="bg-white dark:text-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <ImportContent />

          {/* Usage Limits Display - Above the tabs */}
          {activeTab === "new" && (
            <div>
              {isUsageLoading ? (
                <UsageLimitsSkeleton />
              ) : usageData ? (
                <UsageLimitsDisplay usageData={usageData} />
              ) : null}
            </div>
          )}

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
            usageData={usageData}
          />

          {/* Import History Section */}
          <ImportHistorySection
            importHistory={importHistory}
            onDelete={handleDeleteImport}
            activeTab={activeTab}
          />

          {/* Modal */}
          <ImportModalWrapper
            isOpen={showModal}
            onClose={() => {
              setShowModal(false);
              setError(null);
              setMissingFields([]);
              setImportLimitExceeded(null);
            }}
            missingFields={missingFields}
            errorMessage={error ?? undefined}
            importLimitExceeded={importLimitExceeded}
          />

          <HelpSection />
        </div>
      </div>
    </div>
  );
};

export default ImportManager;
