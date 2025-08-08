// src/types/adminTypes.ts
export interface AdminDetails {
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

export interface Agent {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  lastLogin?: string;
  createdAt: string;
}

export interface Lead {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  createdAt: string;
}

export interface Subscription {
  _id: string;
  plan: string;
  status: string;
  maxUsers: number;
  maxLeads: number;
  endDate: string;
  amount: number;
  currency: string;
}

export interface ActivityType {
  _id: string;
  type: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  details: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface ActivityData {
  _id: string;
  type: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  details: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface Ad {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  status: string;
  createdAt: string;
}

export interface Payment {
  _id: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  transactionId: string;
  createdAt: string;
  description?: string;
  subscriptionId?: string;
}

export interface AdminDetailsResponse {
  admin: AdminDetails;
  agents: Agent[];
  leads: { data: Lead[] };
  subscription: Subscription | null;
  activities: ActivityType[];
  ads: Ad[];
  payments: Payment[];
}

export interface PlatformStats {
  totalAdmins: number;
  totalAgents: number;
  totalLeads: number;
  activeSubscriptions: number;
  totalBalance?: number;
}

// Complete AdminStats interface with all properties needed by components
export interface AdminStats {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  agentCount: number;
  leadCount: number;
  balance: number;
  lastLogin?: string;
  createdAt: string;
  recentActivity: ActivityData[];
  subscription?: {
    _id: string;
    plan: string;
    status: string;
    maxUsers: number;
    maxLeads: number;
    endDate: string;
    amount: number;
    currency: string;
  };
  lastAgentLogin?: {
    _id: string;
    firstName: string;
    lastName: string;
    lastLogin: string;
  };
}

// Raw API response interface
export interface RawAdminData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  agentsCount?: number;
  agentCount?: number;
  leadsCount?: number;
  leadCount?: number;
  balance?: number;
  lastLogin?: string;
  createdAt: string;
  recentActivity?: string | ActivityData[];
  subscription?: {
    _id: string;
    plan: string;
    status: string;
    maxUsers: number;
    maxLeads: number;
    endDate: string;
    amount: number;
    currency: string;
  };
  lastAgentLogin?: {
    _id: string;
    firstName: string;
    lastName: string;
    lastLogin: string;
  };
}

export interface AdminOverviewResponse {
  admins: AdminStats[];
  platformStats: PlatformStats;
}

export interface RawAdminOverviewResponse {
  admins: RawAdminData[];
  platformStats: PlatformStats;
}
