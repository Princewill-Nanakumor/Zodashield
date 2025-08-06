"use client";

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Shield,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Crown,
  User,
} from "lucide-react";

const UserCreationHelp: React.FC = () => {
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "overview"
  );

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const sections = [
    {
      id: "overview",
      title: "User Management Overview",
      icon: <Users className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            User management allows you to create and manage team members.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Crown className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-200">
                    ADMIN Role
                  </h4>
                  <p className="text-sm text-blue-800 dark:text-blue-300 mt-1">
                    Full access to all features, can manage users, leads,
                    billing, and settings
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <User className="w-6 h-6 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900 dark:text-green-200">
                    AGENT Role
                  </h4>
                  <p className="text-sm text-green-800 dark:text-green-300 mt-1">
                    Can view and work on assigned leads, limited access to
                    settings
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "creating",
      title: "Creating New Users",
      icon: <UserPlus className="w-5 h-5" />,
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
                    Navigate to User Management
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Go to Dashboard → Users
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                  2
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Click to Create User
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Look for the button with a user plus icon
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                  3
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Fill in Personal Information
                  </p>
                  <div className="mt-2 space-y-1 text-gray-600 dark:text-gray-400">
                    <p>• First Name and Last Name</p>
                    <p>• Email Address (used for login)</p>
                    <p>• Phone Number</p>
                    <p>• Country</p>
                    <p>• Create a secure password for the user</p>
                  </div>
                </div>
              </li>

              <li className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-medium">
                  ✓
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Save User
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Click Create User to save the new user
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      id: "roles",
      title: "User Roles & Permissions",
      icon: <Shield className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ADMIN Role */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-purple-600 text-white rounded-lg">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-purple-900 dark:text-purple-200">
                    ADMIN
                  </h4>
                  <p className="text-sm text-purple-700 dark:text-purple-300">
                    Full system access
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <h5 className="font-medium text-purple-900 dark:text-purple-200">
                  Permissions:
                </h5>
                <ul className="space-y-1 text-sm text-purple-800 dark:text-purple-300">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Create and manage users</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>View all leads</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Import leads</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Assign/unassign leads</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Manage billing & subscriptions</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Create/edit statuses</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Access all settings</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* AGENT Role */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-600 text-white rounded-lg">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-green-900 dark:text-green-200">
                    AGENT
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Limited access for team members
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <h5 className="font-medium text-green-900 dark:text-green-200">
                  Permissions:
                </h5>
                <ul className="space-y-1 text-sm text-green-800 dark:text-green-300">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>View assigned leads only</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Update lead information</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Change lead status</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Add notes and activities</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>Cannot create users</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>Cannot access billing</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>Limited settings access</span>
                  </li>
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
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">User Creation & Management</h1>
              <p className="text-green-100 mt-1">
                Learn how to create and manage team members in your CRM
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
                      <div className="text-green-600 dark:text-green-400">
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

export default UserCreationHelp;
