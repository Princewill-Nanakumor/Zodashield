"use client";

import React, { useState } from "react";
import {
  Tag,
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

const StatusCreationHelp: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "overview"
  );

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const sections = [
    {
      id: "overview",
      title: "Status Management Overview",
      icon: <Tag className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Status management allows you to create custom statuses to track the
            progress of your imports
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-200">
                  Why Use Custom Statuses?
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                  Custom statuses help you organize leads, track progress, and
                  ensure nothing falls through the cracks
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "creating",
      title: "Creating New Statuses",
      icon: <Plus className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              Step-by-Step Process:
            </h4>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                  1
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Navigate to All leads
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Go to Dashboard → All-leads → Add Status
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                  2
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Click to Create New Status
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Look for the Add status button with a plus icon
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                  3
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Fill in Status Details
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Enter a name
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                  4
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Choose Color
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Select a color to help visually identify the status
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                  ✓
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Create Status
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Click to save your new status
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: "examples",
      title: "Status Examples",
      icon: <CheckCircle className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Here are some common status examples used
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                Initial Contact Statuses
              </h4>
              <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
                <li>• New Lead</li>
                <li>• Hot </li>
              </ul>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 dark:text-yellow-200 mb-2">
                Active
              </h4>
              <ul className="space-y-1 text-sm text-yellow-800 dark:text-yellow-300">
                <li>• Documentation Review</li>
                <li>• No Answer</li>
                <li>• Pending</li>
              </ul>
            </div>
            <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h4 className="font-medium text-green-900 dark:text-green-200 mb-2">
                Resolution
              </h4>
              <ul className="space-y-1 text-sm text-green-800 dark:text-green-300">
                <li>• Potential</li>
                <li>• Callback</li>
                <li>• Case Closed</li>
              </ul>
            </div>
            <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="font-medium text-red-900 dark:text-red-200 mb-2">
                Inactive
              </h4>
              <ul className="space-y-1 text-sm text-red-800 dark:text-red-300">
                <li>• Unresponsive</li>
                <li>• Trash</li>
                <li>• Wrong Language</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "management",
      title: "Managing Existing Statuses",
      icon: <Edit3 className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              Available Actions:
            </h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Edit3 className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Edit Status
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Update name or color of existing statuses
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Delete Status
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Remove statuses that are no longer needed
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900 dark:text-amber-200">
                  Important Note
                </h4>
                <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
                  When deleting a status that is assigned to leads, Will change
                  the status back to new
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "bestpractices",
      title: "Best Practices",
      icon: <CheckCircle className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h4 className="font-medium text-green-900 dark:text-green-200 mb-3 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Do&rsquo;s
              </h4>
              <ul className="space-y-2 text-sm text-green-800 dark:text-green-300">
                <li>• Use clear, descriptive names</li>
                <li>• Use consistent color coding</li>
                <li>• Keep status names unique</li>
                <li>• Review</li>
              </ul>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="font-medium text-red-900 dark:text-red-200 mb-3 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Don&rsquo;ts
              </h4>
              <ul className="space-y-2 text-sm text-red-800 dark:text-red-300">
                <li>• Avoid vague or confusing names</li>
                <li>• Don&rsquo;t use similar colors</li>
                <li>• Don&rsquo;t delete statuses in active use</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <Tag className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">
                Status Creation & Management
              </h1>
              <p className="text-blue-100 mt-1">
                Learn how to create and manage custom statuses for your leads
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {sections.map((section) => (
              <div
                key={section.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-blue-600 dark:text-blue-400">
                        {section.icon}
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {section.title}
                      </h3>
                    </div>
                    {expandedSection === section.id ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </button>
                {expandedSection === section.id && (
                  <div className="px-4 pb-4">
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                      {section.content}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusCreationHelp;
