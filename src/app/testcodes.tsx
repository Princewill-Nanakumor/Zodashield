// import { Table as TanstackTable, flexRender } from "@tanstack/react-table";

// import { Lead, Status } from "@/types/leads";

// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/Table";

// import { Badge } from "@/components/ui/badge";

// import { Loader2 } from "lucide-react";

// import { useState, useEffect, useCallback } from "react";

// import { useToast } from "@/components/ui/use-toast";

// interface TableContentProps {
//   table: TanstackTable<Lead>;

//   onRowClick: (lead: Lead) => void;

//   selectedLead: Lead | null;
// }

// export function TableContent({
//   table,

//   onRowClick,

//   selectedLead,
// }: TableContentProps) {
//   const { toast } = useToast();

//   const [statuses, setStatuses] = useState<Status[]>([]);

//   const [isLoading, setIsLoading] = useState(true);

//   const fetchStatuses = useCallback(async () => {
//     try {
//       setIsLoading(true);

//       const response = await fetch("/api/statuses");

//       if (!response.ok) throw new Error("Failed to fetch statuses");

//       let data = await response.json();

//       const hasNewStatus = data.some((status: Status) => status._id === "NEW");

//       if (!hasNewStatus) {
//         data.unshift({
//           _id: "NEW",

//           name: "New",

//           color: "#3B82F6",

//           createdAt: new Date().toISOString(),

//           updatedAt: new Date().toISOString(),
//         });
//       }

//       // Sort statuses

//       data = data.sort((a: Status, b: Status) => {
//         if (a._id === "NEW") return -1;

//         if (b._id === "NEW") return 1;

//         return (
//           new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
//         );
//       });

//       setStatuses(data);
//     } catch (error) {
//       console.error("Error fetching statuses:", error);

//       toast({
//         title: "Error",

//         description: "Failed to load statuses",

//         variant: "destructive",
//       });
//     } finally {
//       setIsLoading(false);
//     }
//   }, [toast]);

//   useEffect(() => {
//     fetchStatuses();
//   }, [fetchStatuses]);

//   const getStatusStyle = (leadStatus: string) => {
//     const status = statuses.find((s) => s._id === leadStatus);

//     if (!status) {
//       return {
//         backgroundColor: "#3B82F615",

//         color: "#3B82F6",

//         borderColor: "#3B82F630",
//       };
//     }

//     return {
//       backgroundColor: `${status.color}15`,

//       color: status.color,

//       borderColor: `${status.color}30`,
//     };
//   };

//   const renderStatus = (leadStatus: string) => {
//     if (isLoading) {
//       return (
//         <Badge variant="outline" className="flex items-center gap-1.5">
//           <Loader2 className="h-3 w-3 animate-spin" />
//           Loading...
//         </Badge>
//       );
//     }

//     const status = statuses.find((s) => s._id === leadStatus);

//     const statusColor = status?.color || "#3B82F6";

//     const statusName = status?.name || "New";

//     return (
//       <Badge
//         variant="outline"
//         style={getStatusStyle(leadStatus)}
//         className="flex items-center gap-1.5"
//       >
//         <div
//           className="w-1.5 h-1.5 rounded-full"
//           style={{ backgroundColor: statusColor }}
//         />

//         {statusName}
//       </Badge>
//     );
//   };

//   return (
//     <div className="rounded-md border">
//       <Table>
//         <TableHeader>
//           {table.getHeaderGroups().map((headerGroup) => (
//             <TableRow key={headerGroup.id}>
//               {headerGroup.headers.map((header) => (
//                 <TableHead key={header.id}>
//                   {header.isPlaceholder
//                     ? null
//                     : flexRender(
//                         header.column.columnDef.header,
//                         header.getContext()
//                       )}
//                 </TableHead>
//               ))}
//             </TableRow>
//           ))}
//         </TableHeader>
//         <TableBody>
//           {table.getRowModel().rows?.length ? (
//             table.getRowModel().rows.map((row) => {
//               const lead = row.original;
//               const isSelected = selectedLead && lead._id === selectedLead._id;

//               return (
//                 <TableRow
//                   key={row.id}
//                   data-state={isSelected ? "selected" : undefined}
//                   onClick={() => onRowClick(lead)}
//                   className={`
//                     cursor-pointer transition-colors
//                     ${
//                       isSelected
//                         ? "bg-primary/10 dark:bg-primary/20"
//                         : "hover:bg-gray-100 dark:hover:bg-gray-800"
//                     }
//                   `}
//                 >
//                   {row.getVisibleCells().map((cell) => (
//                     <TableCell key={cell.id}>
//                       {cell.column.id === "status"
//                         ? renderStatus(lead.status)
//                         : flexRender(
//                             cell.column.columnDef.cell,
//                             cell.getContext()
//                           )}
//                     </TableCell>
//                   ))}
//                 </TableRow>
//               );
//             })
//           ) : (
//             <TableRow>
//               <TableCell
//                 colSpan={table.getAllColumns().length}
//                 className="h-24 text-center"
//               >
//                 No results found
//               </TableCell>
//             </TableRow>
//           )}
//         </TableBody>
//       </Table>
//     </div>
//   );
// }
