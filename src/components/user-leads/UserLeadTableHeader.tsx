// src/components/user-leads/UserLeadTableHeader.tsx
import { TableHead } from "@/components/ui/Table";

export function UserLeadTableHeader() {
  return (
    <>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Phone</TableHead>
      <TableHead>Country</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Source</TableHead>
      <TableHead>Assigned To</TableHead>
    </>
  );
}

export default UserLeadTableHeader;
