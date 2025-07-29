// src/components/UsageDisplay.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Users, FileText } from "lucide-react";

interface UsageData {
  currentLeads: number;
  maxLeads: number;
  currentUsers: number;
  maxUsers: number;
  remainingLeads: number;
  remainingUsers: number;
}

interface UsageDisplayProps {
  usage: UsageData;
  subscriptionStatus: string;
}

export default function UsageDisplay({ usage }: UsageDisplayProps) {
  const leadsPercentage = (usage.currentLeads / usage.maxLeads) * 100;
  const usersPercentage = (usage.currentUsers / usage.maxUsers) * 100;

  const isNearLimit = (percentage: number) => percentage >= 80;
  const isAtLimit = (percentage: number) => percentage >= 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Leads Usage */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-sm">
            <FileText className="h-4 w-4" />
            <span>Leads Usage</span>
            {isNearLimit(leadsPercentage) && (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{usage.currentLeads} used</span>
              <span>{usage.maxLeads} total</span>
            </div>
            <Progress
              value={leadsPercentage}
              className={`${
                isAtLimit(leadsPercentage)
                  ? "bg-red-200"
                  : isNearLimit(leadsPercentage)
                    ? "bg-yellow-200"
                    : "bg-green-200"
              }`}
            />
            {usage.remainingLeads > 0 && (
              <p className="text-xs text-gray-600">
                {usage.remainingLeads} leads remaining
              </p>
            )}
            {usage.remainingLeads === 0 && (
              <p className="text-xs text-red-600">
                Limit reached - upgrade to add more leads
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Members Usage */}
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-sm">
            <Users className="h-4 w-4" />
            <span>Team Members</span>
            {isNearLimit(usersPercentage) && (
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{usage.currentUsers} used</span>
              <span>{usage.maxUsers} total</span>
            </div>
            <Progress
              value={usersPercentage}
              className={`${
                isAtLimit(usersPercentage)
                  ? "bg-red-200"
                  : isNearLimit(usersPercentage)
                    ? "bg-yellow-200"
                    : "bg-green-200"
              }`}
            />
            {usage.remainingUsers > 0 && (
              <p className="text-xs text-gray-600">
                {usage.remainingUsers} members remaining
              </p>
            )}
            {usage.remainingUsers === 0 && (
              <p className="text-xs text-red-600">
                Limit reached - upgrade to add more team members
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
