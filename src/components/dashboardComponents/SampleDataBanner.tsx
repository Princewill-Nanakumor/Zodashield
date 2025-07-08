// src/components/importComponents/SampleDataBanner.tsx
import { FileSpreadsheet } from "lucide-react";

export const SampleDataBanner = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 border flex items-center justify-between dark:text-white">
    <div className="flex items-center gap-4">
      <div className="bg-blue-100 rounded-lg p-3">
        <FileSpreadsheet className="w-6 h-6 text-blue-600" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Test with sample data
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Get started with sample data, including contacts, deals and
          activities.
        </p>
      </div>
    </div>
    <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 font-medium dark:bg-gray-900 dark:text-white">
      Try sample data
    </button>
  </div>
);
