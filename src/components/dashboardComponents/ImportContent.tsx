// src/components/importComponents/ImportContent.tsx
import { BookOpen } from "lucide-react";

export const ImportContent = () => (
  <div className="p-6 ">
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        Import data
      </h1>
      <button className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-white dark:hover:bg-gray-900">
        <BookOpen className="w-5 h-5" />
        Learn more
      </button>
    </div>
    <p className="text-gray-600 mb-6 dark:text-gray-300">
      Choose how you like to import people, organizations, deals, leads, notes
      and activities.
    </p>
  </div>
);
