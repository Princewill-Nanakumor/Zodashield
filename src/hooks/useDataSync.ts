// src/hooks/useDataSync.ts
import { useEffect, useRef } from "react";
import { Lead } from "@/types/leads";
import { User } from "@/types/user.types";

export const useDataSync = (
  leads: Lead[],
  users: User[],
  isLoadingLeads: boolean,
  isLoadingUsers: boolean,
  setLeads: (leads: Lead[]) => void,
  setUsers: (users: User[]) => void,
  setLoadingLeads: (loading: boolean) => void,
  setLoadingUsers: (loading: boolean) => void
) => {
  const lastLeadsRef = useRef<Lead[]>([]);
  const lastUsersRef = useRef<User[]>([]);
  const lastLoadingLeadsRef = useRef<boolean>(false);
  const lastLoadingUsersRef = useRef<boolean>(false);

  // Sync data from useLeads hook to store
  useEffect(() => {
    if (JSON.stringify(leads) !== JSON.stringify(lastLeadsRef.current)) {
      lastLeadsRef.current = leads;
      setLeads(leads);
    }
  }, [leads, setLeads]);

  useEffect(() => {
    if (JSON.stringify(users) !== JSON.stringify(lastUsersRef.current)) {
      lastUsersRef.current = users;
      setUsers(users);
    }
  }, [users, setUsers]);

  useEffect(() => {
    if (isLoadingLeads !== lastLoadingLeadsRef.current) {
      lastLoadingLeadsRef.current = isLoadingLeads;
      setLoadingLeads(isLoadingLeads);
    }
  }, [isLoadingLeads, setLoadingLeads]);

  useEffect(() => {
    if (isLoadingUsers !== lastLoadingUsersRef.current) {
      lastLoadingUsersRef.current = isLoadingUsers;
      setLoadingUsers(isLoadingUsers);
    }
  }, [isLoadingUsers, setLoadingUsers]);
};

// Default export
export default useDataSync;
