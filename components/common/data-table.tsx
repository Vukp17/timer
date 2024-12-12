'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { MoreHorizontal, Search, ArrowUp, ArrowDown } from 'lucide-react'
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

// Debounce function
function debounce(func: (...args: any[]) => void, wait: number) {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function DataTable<T>({ data, columns, onEdit, onDelete, onSearch, onSort }: DataTableProps<T>) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [filteredData, setFilteredData] = useState(data)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  const page = Number(searchParams.get('page') || '1')
  const pageSize = 10
  const search = searchParams.get('search') || ''

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

  const handleSort = (column: string) => {
    const newOrder = sortColumn === column && sortOrder === 'asc' ? 'desc' : 'asc'
    setSortColumn(column)
    setSortOrder(newOrder)
    if (onSort) {
      onSort(column, newOrder)
    }
  }

  const debouncedHandleSearch = useCallback(debounce(handleSearch, 0), [handleSearch]);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Search className="w-4 h-4 text-gray-500" />
        <Input
          type="search"
          placeholder="Search..."
          className="max-w-sm"
          value={search}
          onChange={(e) => debouncedHandleSearch(e.target.value)}
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.accessorKey as string} onClick={() => handleSort(column.accessorKey as string)}>
                {column.header}
                {sortColumn === column.accessorKey && (
                  sortOrder === 'asc' ? <ArrowUp className="inline-block ml-2" /> : <ArrowDown className="inline-block ml-2" />
                )}
              </TableHead>
            ))}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedData.map((item, index) => (
            <TableRow key={index}>
              {columns.map((column) => (
                <TableCell key={column.accessorKey as string}>
                  {item[column.accessorKey] as React.ReactNode}
                </TableCell>
              ))}
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
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
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              href={page > 1 ? `${pathname}?${createQueryString('page', (page - 1).toString())}` : '#'}
              className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
          {[...Array(totalPages)].map((_, i) => (
            <PaginationItem key={i}>
              <PaginationLink 
                href={`${pathname}?${createQueryString('page', (i + 1).toString())}`}
                isActive={page === i + 1}
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext 
              href={page < totalPages ? `${pathname}?${createQueryString('page', (page + 1).toString())}` : '#'}
              className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}