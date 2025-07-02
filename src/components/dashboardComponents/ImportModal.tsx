// src/components/dashboardComponents/ImportModal.tsx
import { useEffect } from "react";
import { AlertTriangle, XCircle } from "lucide-react";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  missingFields: string[];
  errorMessage?: string;
}

export function ImportModal({
  isOpen,
  onClose,
  missingFields,
  errorMessage,
}: ImportModalProps) {
  useEffect(() => {
    if (isOpen || missingFields.length > 0 || errorMessage) {
      console.log("Modal state updated:", {
        isOpen,
        missingFields,
        hasMissingFields: missingFields.length > 0,
        errorMessage,
      });
    }
  }, [isOpen, missingFields, errorMessage]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-2xl p-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-red-100 text-red-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800">
            Invalid Sheet Format
          </h3>
        </div>

        <div className="space-y-4">
          {/* Show error message if present */}
          {errorMessage && (
            <div className="flex items-start gap-3 bg-red-100 p-4 rounded-lg">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}

          {/* Only show the missing fields section if there are missing fields and NO error message */}
          {missingFields.length > 0 && !errorMessage && (
            <>
              <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-lg">
                <p className="text-sm text-amber-800">
                  Your sheet is missing required fields. Please update your
                  sheet with the following requirements:
                </p>
              </div>

              <div className="bg-gray-100 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">
                  Required Column Headers:
                </h4>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
                  <li>
                    <strong>Name</strong> – Use one of:
                    <ul className="list-none pl-6 text-gray-600">
                      <li>• Name</li>
                      <li>• Full name</li>
                      <p>• First&nbsp;Name&nbsp;and&nbsp;Last&nbsp;Name</p>
                    </ul>
                  </li>
                  <li>
                    <strong>Email</strong> &ndash; Use one of:
                    <ul className="list-none pl-6 text-gray-600">
                      <li>• Email</li>
                      <li>• Email Address</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Phone</strong> – Use one of:
                    <ul className="list-none pl-6 text-gray-600">
                      <li>• Phone</li>
                      <li>• Phone Number</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Country</strong> – Use:
                    <ul className="list-none pl-6 text-gray-600">
                      <li>• Country</li>
                    </ul>
                  </li>
                </ul>
              </div>

              <div className="bg-red-100 p-4 rounded-lg">
                <h4 className="font-medium text-red-700 mb-2">
                  Missing Fields:
                </h4>
                <ul className="list-disc list-inside text-sm text-red-600">
                  {missingFields.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between mt-6 border-t pt-4">
          <p className="text-sm text-gray-600">
            Please update your sheet and try again.
          </p>
          <button
            onClick={() => {
              console.log("Close button clicked");
              onClose();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
