import { Table } from "@tanstack/react-table";
import { Lead } from "@/types/leads";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TableHeaderProps {
  table: Table<Lead>;
  pageSize: number;
  pageIndex: number;
  totalRows: number;
}

const pageSizeOptions = [10, 15, 20, 30, 40, 50, 100, 500];

export function TableHeader({
  table,
  pageSize,
  pageIndex,
  totalRows,
}: TableHeaderProps) {
  const currentPageStart = pageIndex * pageSize + 1;
  const currentPageEnd = Math.min((pageIndex + 1) * pageSize, totalRows);

  return (
    <div className="flex justify-between items-center mb-4 my-3">
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Show
        </label>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
          }}
        >
          <SelectTrigger className="w-[80px]">
            <SelectValue placeholder={pageSize} />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          entries
        </span>
      </div>
      <div className="text-sm text-gray-700 dark:text-gray-300">
        Showing {currentPageStart} to {currentPageEnd} of {totalRows} entries
      </div>
    </div>
  );
}
