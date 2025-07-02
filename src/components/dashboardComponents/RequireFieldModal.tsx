interface RequiredFieldsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RequiredFieldsModal = ({
  isOpen,
  onClose,
}: RequiredFieldsModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-lg w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Required Column Headers</h3>
        <p className="text-sm text-gray-600 mb-4">
          Your Excel/CSV file must contain the following column headers
          (case-sensitive):
        </p>
        <ul className="list-disc pl-5 mb-4 space-y-2 text-sm">
          <li>
            <span className="font-semibold">First Name</span> or{" "}
            <span className="font-semibold">Full Name</span>
          </li>
          <li>
            <span className="font-semibold">Last Name</span> (optional if Full
            Name is provided)
          </li>
          <li>
            <span className="font-semibold">Email Address</span> or{" "}
            <span className="font-semibold">Email</span>
          </li>
          <li>
            <span className="font-semibold">Phone Number</span> or{" "}
            <span className="font-semibold">Phone</span>
          </li>
          <li>
            <span className="font-semibold">Country</span>
          </li>
        </ul>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <p className="text-sm text-yellow-700">
            <span className="font-bold">Note:</span> Headers are case-sensitive.
            Make sure they match exactly as shown above.
          </p>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
