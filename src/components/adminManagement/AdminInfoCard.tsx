// src/components/adminManagement/AdminInfoCard.tsx
"use client";

import { Mail, Phone, Globe, Clock, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AdminDetails {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  country?: string;
  status: string;
  lastLogin?: string;
  createdAt: string;
  balance?: number;
}

interface Subscription {
  _id: string;
  plan: string;
  status: string;
  maxUsers: number;
  maxLeads: number;
  endDate: string;
  amount: number;
  currency: string;
}

interface AdminInfoCardProps {
  admin: AdminDetails;
  subscription: Subscription | null;
  getStatusColor: (status: string) => string;
  formatLastLogin: (lastLogin?: string) => string;
}

export default function AdminInfoCard({
  admin,
  subscription,
  getStatusColor,
  formatLastLogin,
}: AdminInfoCardProps) {
  return (
    <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
          <Shield className="h-5 w-5" />
          <span>Admin Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                {admin.firstName[0]}
                {admin.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {admin.firstName} {admin.lastName}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getStatusColor(admin.status)}>
                  {admin.status}
                </Badge>
                {subscription && (
                  <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                    {subscription.plan}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {admin.email}
              </span>
            </div>
            {admin.phoneNumber && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {admin.phoneNumber}
                </span>
              </div>
            )}
            {admin.country && (
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {admin.country}
                </span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Last login: {formatLastLogin(admin.lastLogin)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
