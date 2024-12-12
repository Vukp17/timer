export interface Column<T> {
    header: string
    accessorKey: keyof T
  }
  
  export interface DataTableProps<T> {
    data: T[];
    columns: { header: string; accessorKey: keyof T }[];
    onEdit: (item: T) => void;
    onDelete: (item: T) => void;
    onSearch?: (term: string) => void;
    onSort?: (column: string, order: 'asc' | 'desc') => void;
    onPageChange?: (page: number) => void; // New prop for pagination change
  }