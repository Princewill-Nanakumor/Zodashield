import { Lead } from "@/types/leads";
import { LeadColumn } from "@/components/leads/LeadsTableColumns.tsx/TableColumns";

export function useAdminLeadsTableColumns(): LeadColumn[] {
  return [
    {
      id: "name",
      accessorFn: (row: Lead) =>
        row.name || `${row.firstName} ${row.lastName}`.trim() || "—",
      header: "Name",
      sortingFn: (a, b) => {
        const nameA =
          a.original.name ||
          `${a.original.firstName} ${a.original.lastName}`.trim();
        const nameB =
          b.original.name ||
          `${b.original.firstName} ${b.original.lastName}`.trim();
        return nameA.localeCompare(nameB);
      },
    },
    {
      id: "email",
      accessorKey: "email",
      header: "Email",
      cell: (info) => info.getValue() || "—",
      sortingFn: (a, b) =>
        (a.original.email || "—").localeCompare(b.original.email || "—"),
    },
    {
      id: "phone",
      accessorFn: (row: Lead) => row.phone || "—",
      header: "Phone",
      sortingFn: (a, b) =>
        (a.original.phone || "—").localeCompare(b.original.phone || "—"),
    },
    {
      id: "country",
      accessorFn: (row: Lead) => row.country || "—",
      header: "Country",
      sortingFn: (a, b) =>
        (a.original.country || "—").localeCompare(b.original.country || "—"),
    },
    {
      id: "status",
      accessorFn: (row: Lead) => row.status || "—",
      header: "Status",
      sortingFn: (a, b) =>
        (a.original.status || "—").localeCompare(b.original.status || "—"),
    },
    {
      id: "source",
      accessorFn: (row: Lead) => row.source || "—",
      header: "Source",
      sortingFn: (a, b) =>
        (a.original.source || "—").localeCompare(b.original.source || "—"),
    },
    {
      id: "assignedTo",
      header: "Assigned To",
      accessorFn: (row: Lead) => {
        const assignedTo = row.assignedTo;
        if (!assignedTo) return "Unassigned";

        // Check if assignedTo is a string or object
        if (typeof assignedTo === "string") {
          return assignedTo;
        }

        // If it's an object, check if firstName and lastName exist
        if (assignedTo.firstName && assignedTo.lastName) {
          return `${assignedTo.firstName} ${assignedTo.lastName}`;
        }

        return "Unknown User";
      },
      sortingFn: (a, b) => {
        const assignedToA = a.original.assignedTo;
        const assignedToB = b.original.assignedTo;

        // Helper function to get assigned user name
        const getAssignedUserName = (
          assignedTo:
            | string
            | { id: string; firstName: string; lastName: string }
            | null
            | undefined
        ) => {
          if (!assignedTo) return "Unassigned";

          if (typeof assignedTo === "string") {
            return assignedTo;
          }

          if (assignedTo.firstName && assignedTo.lastName) {
            return `${assignedTo.firstName} ${assignedTo.lastName}`;
          }

          return "Unknown User";
        };

        const nameA = getAssignedUserName(assignedToA);
        const nameB = getAssignedUserName(assignedToB);

        return nameA.localeCompare(nameB);
      },
    },
  ];
}
