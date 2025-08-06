"use client";

import React, { useState } from "react";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  MapPin,
  User,
  Phone,
  Mail,
} from "lucide-react";

const ImportHelp: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "overview"
  );

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const requiredFields = [
    {
      name: "name",
      icon: <User className="w-4 h-4" />,
      description: "Full name of the lead (Required)",
    },
    {
      name: "email",
      icon: <Mail className="w-4 h-4" />,
      description: "Email address for contact (Required)",
    },
    {
      name: "phone",
      icon: <Phone className="w-4 h-4" />,
      description: "Phone number for contact (Required)",
    },
    {
      name: "country",
      icon: <MapPin className="w-4 h-4" />,
      description: "Country of residence (Required)",
    },
  ];

  const optionalFields = [
    {
      name: "source",
      description: "Source of the lead (e.g., website, referral)",
    },
  ];

  const sections = [
    {
      id: "overview",
      title: "Import Overview",
      icon: <Upload className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            The import feature allows you to bulk upload data from CSV files,
            saving time when adding multiple data to your CRM system.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
              <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
              <h4 className="font-medium text-blue-900 dark:text-blue-200">
                CSV Format
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                Support for comma-separated values
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
              <Upload className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
              <h4 className="font-medium text-green-900 dark:text-green-200">
                Bulk Upload
              </h4>
              <p className="text-sm text-green-800 dark:text-green-300 mt-1">
                Import hundreds of leads at once
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 text-center">
              <CheckCircle className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
              <h4 className="font-medium text-purple-900 dark:text-purple-200">
                Validation
              </h4>
              <p className="text-sm text-purple-800 dark:text-purple-300 mt-1">
                Automatic data validation
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "preparing",
      title: "Preparing Your CSV File",
      icon: <FileText className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              Required Fields
            </h4>
            <div className="space-y-3">
              {requiredFields.map((field, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <div className="text-red-600 dark:text-red-400 mt-0.5">
                    {field.icon}
                  </div>
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-200">
                      {field.name}
                    </p>
                    <p className="text-sm text-red-800 dark:text-red-300">
                      {field.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              Optional Fields
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {optionalFields.map((field, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                >
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-200">
                      {field.name}
                    </p>
                    <p className="text-sm text-green-800 dark:text-green-300">
                      {field.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-3">
              CSV Format Example
            </h4>
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-3 overflow-x-auto">
              <pre className="text-sm text-gray-700 dark:text-gray-300">
                {`Name,Email,Phone,Country,Source,
John Doe,john@email.com,+1234567890,Germany,Website
Jane Smith,jane@email.com,+1987654321,Canada,Referral,`}
              </pre>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "importing",
      title: "Import Process",
      icon: <Upload className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              Step-by-Step Import Process:
            </h4>
            <ol className="space-y-4 text-sm">
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                  1
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Access Import Feature
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Go to Dashboard → Import
                  </p>
                </div>
              </li>

              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                  2
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Select Your CSV File
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Click Choose File and select your prepared CSV
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                  3
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Preview Import Data
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Review the data preview to ensure correct mapping
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                  4
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Map Columns (if needed)
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Ensure CSV columns match the required fields
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                  ✓
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Start Import
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Click Import Leads to begin the upload process
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: "validation",
      title: "Data Validation & Error Handling",
      icon: <CheckCircle className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h4 className="font-medium text-green-900 dark:text-green-200 mb-3 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Validation Checks
              </h4>
              <ul className="space-y-2 text-sm text-green-800 dark:text-green-300">
                <li>• Required fields presence</li>
                <li>• Email format validation</li>
                <li>• Phone number format</li>
                <li>• Country name validation</li>
                <li>• Duplicate detection</li>
              </ul>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="font-medium text-red-900 dark:text-red-200 mb-3 flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Common Errors
              </h4>
              <ul className="space-y-2 text-sm text-red-800 dark:text-red-300">
                <li>• Missing sheet headers</li>
                <li>• Incorrect file format</li>
                <li>• Duplicate entries</li>
                <li>• Invalid data</li>
              </ul>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900 dark:text-amber-200">
                  Import Results
                </h4>
                <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
                  After import, you will receive a detailed report showing
                  successful imports, skipped records, and any errors that
                  occurred.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },

    {
      id: "tips",
      title: "Best Practices & Tips",
      icon: <Info className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h4 className="font-medium text-green-900 dark:text-green-200 mb-3 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Best Practices
              </h4>
              <ul className="space-y-2 text-sm text-green-800 dark:text-green-300">
                <li>• Use the provided CSV template</li>
                <li>• Clean your data before import</li>
                <li>• Test with a small batch first</li>
                <li>• Ensure all required fields are filled</li>
                <li>• Use consistent formatting</li>
                <li>• Remove duplicate entries</li>
              </ul>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-3 flex items-center">
                <Info className="w-4 h-4 mr-2" />
                Pro Tips
              </h4>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                <li>• Import during off-peak hours</li>
                <li>• Keep file sizes under 5MB</li>
                <li>• Use UTF-8 encoding for special characters</li>
                <li>• Backup existing data before large imports</li>
                <li>• Review import results carefully</li>
                <li>• Update lead assignments after import</li>
              </ul>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-900 dark:text-amber-200">
                  Important Limitations
                </h4>
                <ul className="text-sm text-amber-800 dark:text-amber-300 mt-2 space-y-1">
                  <li>• Only CSV format is supported</li>
                  <li>
                    • Import process may take several minutes for large files
                  </li>
                  <li>• Duplicate emails will be skipped automatically</li>
                </ul>
              </div>
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
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <Upload className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Import Guide</h1>
              <p className="text-purple-100 mt-1">
                Learn how to bulk import data using CSV files
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
                      <div className="text-purple-600 dark:text-purple-400">
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

export default ImportHelp;
