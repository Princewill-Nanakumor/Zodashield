"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, FileText, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UsageData {
  currentLeads: number;
  maxLeads: number;
  remainingLeads: number;
  canImport: boolean;
}

export function UsageLimitsDisplay({ usageData }: { usageData: UsageData }) {
  return (
    <Card className="mx-6 bg-gray-50 border-gray-200 dark:border-gray-700 dark:bg-gray-900 mb-5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-sm">
          <FileText className="h-4 w-4" />
          <span>Import Usage</span>
          {usageData.currentLeads >= usageData.maxLeads * 0.8 && (
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          )}
          {!usageData.canImport && (
            <Badge variant="destructive" className="text-xs">
              Limit Reached
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{usageData.currentLeads} used</span>
            <span>
              {usageData.maxLeads === -1
                ? "Unlimited"
                : `${usageData.maxLeads} total`}
            </span>
          </div>
          <Progress
            value={
              usageData.maxLeads === -1
                ? 0
                : (usageData.currentLeads / usageData.maxLeads) * 100
            }
            className={`${
              usageData.currentLeads >= usageData.maxLeads
                ? "bg-red-200"
                : usageData.currentLeads >= usageData.maxLeads * 0.8
                  ? "bg-yellow-200"
                  : "bg-green-200"
            }`}
          />
          {usageData.maxLeads !== -1 && usageData.remainingLeads > 0 && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {usageData.remainingLeads} leads remaining
            </p>
          )}
          {usageData.maxLeads !== -1 && usageData.remainingLeads === 0 && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Limit reached - upgrade to import more leads
            </p>
          )}
          {usageData.maxLeads === -1 && (
            <p className="text-xs text-green-600 dark:text-green-400">
              Unlimited leads
            </p>
          )}
          {usageData.maxLeads !== -1 && (
            <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
              <div className="flex items-center gap-1 text-blue-700 dark:text-blue-300">
                <Info className="h-3 w-3" />
                <span>
                  You can import up to {usageData.remainingLeads} more leads
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
