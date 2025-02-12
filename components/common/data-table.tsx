'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { MoreHorizontal, Search, ArrowUp, ArrowDown, GripVertical } from 'lucide-react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTableProps } from '@/models/data-table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

export function DataTable<T>({ data, columns, onEdit, onDelete, onSearch, onSort, onPageChange }: DataTableProps<T>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [filteredData, setFilteredData] = useState(data)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const page = Number(searchParams.get('page') || '1')
  const pageSize = 10
  const search = searchParams.get('search') || ''

  const [editingCell, setEditingCell] = useState<{ row: number; column: string } | null>(null)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const resizeStartX = useRef<number>(0)
  const initialWidth = useRef<number>(0)

  useEffect(() => {
    let filtered = data.filter((item) =>
      Object.values(item as Record<string, unknown>).some(
        (value) =>
          typeof value === 'string' &&
          value.toLowerCase().includes(search.toLowerCase())
      )
    )

    if (sortColumn) {
      filtered = filtered.sort((a, b) => {
        const aValue = a[sortColumn as keyof T]
        const bValue = b[sortColumn as keyof T]
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
        return 0
      })
    }

    setFilteredData(filtered)
  }, [data, search, sortColumn, sortOrder])

  const totalPages = Math.ceil(filteredData.length / pageSize)
  const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize)

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    params.set(name, value)
    return params.toString()
  }

  const handleSearch = (term: string) => {
    router.push(pathname + '?' + createQueryString('search', term))
    if (onSearch) {
      onSearch(term)
    }
  }

  const handleSort = (columnKey: keyof T | ((row: T) => React.ReactNode), sortField?: string) => {
    // Determine the actual column to use for sorting
    const column = typeof columnKey === 'string' ? columnKey : sortField;
    if (!column) return; // Ensure we have a valid column

    // Toggle sort order if already sorting by this column
    const newOrder = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortOrder(newOrder);

    if (onSort) {
      onSort(column, newOrder);
    }
  };

  const handlePageChange = (newPage: number) => {
    router.push(pathname + '?' + createQueryString('page', newPage.toString()))
    if (onPageChange) {
      onPageChange(newPage)
    }
  }

  // Handle column resize
  const handleResizeStart = (e: React.MouseEvent, columnKey: string) => {
    e.preventDefault()
    setResizingColumn(columnKey)
    resizeStartX.current = e.clientX
    initialWidth.current = columnWidths[columnKey] || 200
    
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingColumn) {
        const diff = e.clientX - resizeStartX.current
        setColumnWidths(prev => ({
          ...prev,
          [columnKey]: Math.max(100, initialWidth.current + diff)
        }))
      }
    }

    const handleMouseUp = () => {
      setResizingColumn(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Handle cell double click for editing
  const handleCellDoubleClick = (rowIndex: number, columnKey: string) => {
    setEditingCell({ row: rowIndex, column: columnKey })
  }

  // Handle cell edit save
  const handleCellEdit = (value: string, rowIndex: number, columnKey: string) => {
    const updatedItem = { ...data[rowIndex], [columnKey]: value }
    onEdit(updatedItem as T)
    setEditingCell(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Search className="w-4 h-4 text-gray-500" />
        <Input
          type="search"
          placeholder="Search..."
          className="max-w-sm"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>
      <div className="relative overflow-x-auto" style={{ height: 'calc(100vh - 300px)' }}>
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={String(column.accessorKey)}
                  style={{ width: columnWidths[String(column.accessorKey)] || 200 }}
                  className="relative group"
                >
                  <div className="flex items-center">
                    <span
                      className="cursor-pointer flex-1"
                      onClick={() => handleSort(column.accessorKey, column.sortField)}
                    >
                      {column.header}
                      {sortColumn === column.sortField && (
                        sortOrder === 'asc' ? <ArrowUp className="inline-block ml-2" /> : <ArrowDown className="inline-block ml-2" />
                      )}
                    </span>
                    <div
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize opacity-0 group-hover:opacity-100 hover:bg-primary/50"
                      onMouseDown={(e) => handleResizeStart(e, String(column.accessorKey))}
                    >
                      <GripVertical className="h-4 w-4 absolute -right-1 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </TableHead>
              ))}
              <TableHead className="sticky right-0 bg-background w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((item, rowIndex) => (
              <TableRow key={rowIndex} className="group/row hover:bg-muted/50">
                {columns.map((column) => (
                  <TableCell
                    key={String(column.accessorKey)}
                    className="relative"
                    onDoubleClick={() => handleCellDoubleClick(rowIndex, String(column.accessorKey))}
                  >
                    {editingCell?.row === rowIndex && editingCell?.column === String(column.accessorKey) ? (
                      <Input
                        autoFocus
                        defaultValue={String(typeof column.accessorKey === 'function' ? column.accessorKey(item) : item[column.accessorKey as keyof T])}
                        onBlur={(e) => handleCellEdit(e.target.value, rowIndex, String(column.accessorKey))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCellEdit((e.target as HTMLInputElement).value, rowIndex, String(column.accessorKey))
                          }
                        }}
                      />
                    ) : (
                      <span className="block w-full overflow-hidden text-ellipsis">
                        {typeof column.accessorKey === 'function'
                          ? column.accessorKey(item)
                          : String(item[column.accessorKey as keyof T])}
                      </span>
                    )}
                  </TableCell>
                ))}
                <TableCell className="sticky right-0 bg-background">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover/row:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onEdit(item)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(item)}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="mx-auto flex w-full justify-end">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={page > 1 ? `${pathname}?${createQueryString('page', (page - 1).toString())}` : '#'}
                className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
                onClick={() => handlePageChange(page - 1)}
              />
            </PaginationItem>
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  href={`${pathname}?${createQueryString('page', (i + 1).toString())}`}
                  isActive={page === i + 1}
                  onClick={() => handlePageChange(i + 1)}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href={page < totalPages ? `${pathname}?${createQueryString('page', (page + 1).toString())}` : '#'}
                className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
                onClick={() => handlePageChange(page + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}