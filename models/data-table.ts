export interface Column<T> {
  header: string;
  accessorKey: keyof T | ((row: T) => React.ReactNode); // Supports both string key and function
  sortField?: string; // Backend-friendly sort key
  width?: number;
  editable?: boolean;
  type?: 'text' | 'number' | 'select';
  options?: { value: string; label: string }[]; // For select type
}

  
export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onSearch?: (term: string) => void;
  onSort?: (column: string, order: 'asc' | 'desc') => void;
  onPageChange?: (page: number) => void; // New prop for pagination change
  onCellUpdate?: (item: T, field: keyof T, value: any) => void;
}