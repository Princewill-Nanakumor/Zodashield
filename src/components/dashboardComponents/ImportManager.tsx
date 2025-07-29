// src/components/dashboardComponents/ImportManager.tsx
"use client";

import { Loader2 } from "lucide-react";
import FileUploadSection from "@/components/dashboardComponents/FileUploadSection";
import { HelpSection } from "../importPageComponents/HelpSection";
import { ImportTabs } from "@/components/dashboardComponents/ImportTabs";
import { ImportContent } from "@/components/dashboardComponents/ImportContent";

// EXTRACTED COMPONENTS
import { UsageLimitsDisplay } from "@/components/importPageComponents/UsageLimitsDisplay";
import { ImportHistorySection } from "@/components/importPageComponents/ImportHistorySection";
import { ImportModalWrapper } from "@/components/importPageComponents/ImportModalWrapper";

// CUSTOM HOOK
import { useImportManager } from "@/hooks/useImportManager";

export const ImportManager = () => {
  const {
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
    setError,
    setShowModal,
    setActiveTab,
    setMissingFields,
    setImportLimitExceeded,
    handleFileUpload,
    handleDeleteImport,
  } = useImportManager();

  // Show loading spinner when session is loading or during initial data fetch
  if (status === "loading" || isInitialLoading) {
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
          <ImportTabs activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Usage Limits Display */}
          {usageData && <UsageLimitsDisplay usageData={usageData} />}

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
