// src/components/dashboardComponents/EmptyStateAdminLeadsTable.tsx
export const EmptyStateAdminLeadsTable = () => (
  <div className="h-[calc(100vh-200px)] flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="text-gray-400">
        <svg
          className="mx-auto h-12 w-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900">No leads available</h3>
      <p className="text-gray-500">Import leads</p>
    </div>
  </div>
);
