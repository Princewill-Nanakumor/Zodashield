import { FC } from "react";
import { Lead } from "@/types/leads";
import { User, Clock, Tag, ChevronUp, ChevronDown } from "lucide-react";

interface DetailsSectionProps {
  lead: Lead | null;
  isExpanded: boolean;
  onToggle: () => void;
}

export const DetailsSection: FC<DetailsSectionProps> = ({
  lead,
  isExpanded,
  onToggle,
}) => {
  if (!lead) return null;

  // Helper function to get assigned user name - FIXED VERSION
  const getAssignedUserName = () => {
    if (!lead.assignedTo) return "Unassigned";

    if (typeof lead.assignedTo === "string") {
      return "Unassigned";
    }
    if (lead.assignedTo && typeof lead.assignedTo === "object") {
      const assignedTo = lead.assignedTo as {
        firstName?: string;
        lastName?: string;
      };

      if (assignedTo.firstName && assignedTo.lastName) {
        const fullName = `${assignedTo.firstName} ${assignedTo.lastName}`;
        return fullName;
      }
      if (assignedTo.firstName) return assignedTo.firstName;
      if (assignedTo.lastName) return assignedTo.lastName;
    }

    return "Unknown User";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={onToggle}
      >
        <h3 className="font-medium text-gray-900 dark:text-gray-100">
          Details
        </h3>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        )}
      </div>
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Assigned to
              </p>
              <p>{getAssignedUserName()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <Clock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Created
              </p>
              <p>{new Date(lead.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
            <Tag className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Source</p>
              <p>{lead.source}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailsSection;
