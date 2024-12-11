export interface Column<T> {
    header: string
    accessorKey: keyof T
  }
  
  export  interface DataTableProps<T> {
    data: T[]
    columns: Column<T>[]
    onEdit: (item: T) => void
    onDelete: (item: T) => void
    onSearch?: (term: string) => void; // New prop for search callback
    onSort?: (column: string, order: 'asc' | 'desc') => void

  }