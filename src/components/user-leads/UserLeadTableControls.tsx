// src/components/user-leads/UserLeadTableControls.tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserLeadsColumnVisibilityToggle } from "./UserLeadsColumnVisibilityToggle";
import { UserLeadsColumnId } from "@/hooks/useUserLeadsColumnOrder";

interface UserLeadTableControlsProps {
  pageSize: number;
  pageIndex: number;
  totalEntries: number;
  onPageSizeChange: (value: string) => void;
  columnOrder: UserLeadsColumnId[];
}

const PAGE_SIZE_OPTIONS = [10, 15, 20, 30, 40, 50, 100, 200];

// Changed to default export
export default function UserLeadTableControls({
  pageSize,
  pageIndex,
  totalEntries,
  onPageSizeChange,
  columnOrder,
}: UserLeadTableControlsProps) {
  return (
    <div className="p-4 flex justify-between items-center">
      <div className="flex items-center space-x-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Show</span>
        <Select value={pageSize.toString()} onValueChange={onPageSizeChange}>
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder={pageSize} />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          entries
        </span>
        <UserLeadsColumnVisibilityToggle columnOrder={columnOrder} />
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {pageIndex * pageSize + 1} to{" "}
        {Math.min((pageIndex + 1) * pageSize, totalEntries)} of {totalEntries}{" "}
        entries
      </div>
    </div>
  );
}
