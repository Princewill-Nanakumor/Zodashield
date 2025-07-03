// src/components/debug/DataDebugger.tsx
"use client";

import { useEffect } from "react";
import { Lead } from "@/types/leads";
import { User } from "@/types/user.types";

interface DataDebuggerProps {
  leads: Lead[];
  users: User[];
  filterByUser: string;
  isInitialized: boolean;
}

export const DataDebugger: React.FC<DataDebuggerProps> = ({
  leads,
  users,
  filterByUser,
  isInitialized,
}) => {
  useEffect(() => {
    console.log("🔍 === DATA DEBUGGER ===");
    console.log("📊 Leads count:", leads.length);
    console.log("👥 Users count:", users.length);
    console.log("🎯 Filter by user:", filterByUser);
    console.log("✅ Is initialized:", isInitialized);

    if (leads.length > 0) {
      console.log("📋 First lead:", {
        id: leads[0]._id,
        name: `${leads[0].firstName} ${leads[0].lastName}`,
        assignedTo: leads[0].assignedTo,
        assignedToType: typeof leads[0].assignedTo,
        assignedToKeys: leads[0].assignedTo
          ? Object.keys(leads[0].assignedTo)
          : null,
      });
    }

    if (users.length > 0) {
      console.log("👥 First user:", {
        id: users[0].id,
        name: `${users[0].firstName} ${users[0].lastName}`,
        status: users[0].status,
      });
    }

    // Test filtering logic
    const testFilter = (filterValue: string) => {
      const getAssignedUserId = (
        assignedTo: Lead["assignedTo"]
      ): string | null => {
        if (!assignedTo) return null;
        if (typeof assignedTo === "string") return assignedTo;
        if (
          assignedTo &&
          typeof assignedTo === "object" &&
          "id" in assignedTo
        ) {
          return assignedTo.id;
        }
        return null;
      };

      let filtered: Lead[] = [];
      switch (filterValue) {
        case "unassigned":
          filtered = leads.filter(
            (lead) => !getAssignedUserId(lead.assignedTo)
          );
          break;
        case "all":
          filtered = leads;
          break;
        default:
          filtered = leads.filter(
            (lead) => getAssignedUserId(lead.assignedTo) === filterValue
          );
          break;
      }

      console.log(`🧪 Test filter "${filterValue}":`, filtered.length, "leads");
      return filtered;
    };

    if (isInitialized) {
      testFilter("all");
      testFilter("unassigned");
      if (users.length > 0) {
        testFilter(users[0].id);
      }
    }
  }, [leads, users, filterByUser, isInitialized]);

  return null; // This component doesn't render anything
};
