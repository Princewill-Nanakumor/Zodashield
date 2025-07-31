// src/components/adminManagement/types.ts
export interface ActivityData {
  _id: string;
  type: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  details: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface AdminStats {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  lastLogin?: string;
  createdAt: string;
  agentCount: number;
  leadCount: number;
  balance?: number;
  subscription?: {
    plan: string;
    status: string;
    maxUsers: number;
    maxLeads: number;
    endDate: string;
  };
  recentActivity: ActivityData[];
  lastAgentLogin?: {
    lastLogin?: string;
    firstName: string;
    lastName: string;
  };
}
