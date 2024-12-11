export interface Column<T> {
    header: string
    accessorKey: keyof T
  }
  
  export  interface DataTableProps<T> {
    data: T[]
    columns: Column<T>[]
    onEdit: (item: T) => void
    onDelete: (item: T) => void
  }