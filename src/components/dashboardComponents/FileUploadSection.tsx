import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ImportHistoryItem } from "@/types/import";
import { RequiredFieldsModal } from "./RequireFieldModal";
import { ImportHistory } from "@/components/dashboardComponents/ImportHistory";

interface FileUploadSectionProps {
  activeTab: string;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isLoading: boolean;
  error: string | null;
  successMessage: string | null;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  importHistory: ImportHistoryItem[];
  onDelete: (id: string) => void;
  setShowModal: (show: boolean) => void;
  missingFields: string[];
}

export const FileUploadSection = ({
  activeTab,
  fileInputRef,
  isLoading,
  error,
  successMessage,
  handleFileUpload,
  importHistory,
  onDelete,
}: FileUploadSectionProps) => {
  const [showRequiredFields, setShowRequiredFields] = useState(false);
  const { toast } = useToast();

  // Show error toast
  useEffect(() => {
    if (error) {
      toast({
        title: "Import Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Show success toast
  useEffect(() => {
    if (successMessage) {
      toast({
        title: "Import Success",
        description: successMessage,
        variant: "success",
      });
    }
  }, [successMessage, toast]);

  return (
    <div className="p-6">
      {activeTab === "new" && (
        <div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6 border border-gray-200 dark:border-gray-700">
            <h3 className="font-medium mb-2 text-gray-800 dark:text-gray-100">
              Before You Import:
            </h3>
            <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>Ensure your file is in Excel (.xlsx) or CSV format</li>
              <li>
                Required columns: First Name, Last Name or Full Name, Email
                Address, Phone Number, Country
              </li>
              <li>Headers must be case-sensitive and match exactly</li>
              <li>
                <button
                  onClick={() => setShowRequiredFields(true)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                >
                  View detailed requirements
                </button>
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg
                  className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 16"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                  />
                </svg>
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Excel or CSV files
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".xlsx,.xls,.csv,.txt"
                onChange={handleFileUpload}
              />
            </label>
          </div>

          {/* Show loading bar instead of text */}
          {isLoading && (
            <div className="mt-4 w-full">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full animate-loading-bar"
                  style={{ width: "100%" }}
                ></div>
              </div>
              <div className="text-center text-blue-600 dark:text-blue-400 text-xs mt-2">
                Importing, please wait...
              </div>
              <style jsx>{`
                @keyframes loading-bar {
                  0% {
                    transform: translateX(-100%);
                  }
                  100% {
                    transform: translateX(100%);
                  }
                }
                .animate-loading-bar {
                  animation: loading-bar 1.2s linear infinite;
                }
              `}</style>
            </div>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <ImportHistory imports={importHistory} onDelete={onDelete} />
      )}

      <RequiredFieldsModal
        isOpen={showRequiredFields}
        onClose={() => setShowRequiredFields(false)}
      />
    </div>
  );
};

export default FileUploadSection;
