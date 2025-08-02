'use client';

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "./Button";
import { Select } from "./select";

export interface TableColumn<T = any> {
  id: string;
  header: string;
  accessor: string | ((row: T) => React.ReactNode);
  sortable?: boolean;
  sticky?: boolean;
  width?: string;
  className?: string;
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  stickyColumns?: string[];
  sortableColumns?: string[];
  pagination?: {
    enabled: boolean;
    pageSize?: number;
    showSizeSelector?: boolean;
  };
  onRowClick?: (row: T, index: number) => void;
  className?: string;
  loading?: boolean;
  emptyMessage?: string;
}

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc' | null;
}

export function Table<T = any>({
  data,
  columns,
  stickyColumns = [],
  sortableColumns = [],
  pagination = { enabled: true, pageSize: 10, showSizeSelector: true },
  onRowClick,
  className,
  loading = false,
  emptyMessage = "No data available"
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(pagination.pageSize || 10);
  const [sortConfig, setSortConfig] = React.useState<SortConfig>({ column: '', direction: null });

  // Helper to extract primitive value from accessor (string or function)
  const extractValue = React.useCallback((row: T, accessor: string | ((row: T) => React.ReactNode)) => {
    if (typeof accessor === 'string') {
      return (row as any)[accessor];
    } else {
      // Try to extract primitive from function accessor
      const val = accessor(row);
      if (React.isValidElement(val)) {
        // If it's a React element, try to get its children as string
        // (works for simple cases)
        // @ts-ignore
        return typeof val.props.children === 'string' ? val.props.children : '';
      }
      return typeof val === 'object' ? JSON.stringify(val) : val;
    }
  }, []);

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortConfig.column || !sortConfig.direction) return data;

    return [...data].sort((a, b) => {
      const column = columns.find(col => col.id === sortConfig.column);
      if (!column) return 0;

      let aValue = extractValue(a, column.accessor);
      let bValue = extractValue(b, column.accessor);

      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig, columns, extractValue]);

  // Paginate data
  const paginatedData = React.useMemo(() => {
    if (!pagination.enabled) return sortedData;
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize, pagination.enabled]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (columnId: string) => {
    if (!sortableColumns.includes(columnId)) return;

    setSortConfig(prev => {
      if (prev.column === columnId) {
        if (prev.direction === 'asc') return { column: columnId, direction: 'desc' };
        if (prev.direction === 'desc') return { column: '', direction: null };
      }
      return { column: columnId, direction: 'asc' };
    });
  };

  const getSortIcon = (columnId: string) => {
    if (!sortableColumns.includes(columnId)) return null;
    
    if (sortConfig.column === columnId) {
      if (sortConfig.direction === 'asc') return <ArrowUp className="h-4 w-4" />;
      if (sortConfig.direction === 'desc') return <ArrowDown className="h-4 w-4" />;
    }
    return <ArrowUpDown className="h-4 w-4 opacity-50" />;
  };

  const getCellValue = (row: T, column: TableColumn<T>) => {
    if (typeof column.accessor === 'string') {
      return (row as any)[column.accessor];
    }
    return column.accessor(row);
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded mb-2"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Table Container */}
      <div className="relative rounded-priceai border border-priceai-lightgray bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Header */}
            <thead className="bg-gradient-to-r from-priceai-blue/5 to-priceai-lightgreen/5 border-b border-priceai-lightgray">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.id}
                    className={cn(
                      "px-6 py-4 text-left text-sm font-semibold text-priceai-dark",
                      stickyColumns.includes(column.id) && "sticky left-0 bg-gradient-to-r from-priceai-blue/5 to-priceai-lightgreen/5 z-20",
                      sortableColumns.includes(column.id) && "cursor-pointer hover:bg-priceai-blue/10",
                      column.className
                    )}
                    style={{ width: column.width }}
                    onClick={() => handleSort(column.id)}
                  >
                    <div className="flex items-center gap-2">
                      {column.header}
                      {getSortIcon(column.id)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-priceai-lightgray">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-priceai-gray">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className={cn(
                      "hover:bg-gradient-to-r hover:from-priceai-blue/5 hover:to-priceai-lightgreen/5 transition-colors",
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(row, rowIndex)}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.id}
                        className={cn(
                          "px-6 py-4 text-sm text-priceai-dark",
                          stickyColumns.includes(column.id) && "sticky left-0 bg-white z-10 border-r border-priceai-lightgray/30",
                          column.className
                        )}
                        style={{ width: column.width }}
                      >
                        {getCellValue(row, column)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fixed Bottom Pagination - moved outside scrollable area */}
      {pagination.enabled && (
        <div className="sticky bottom-0 h-auto left-0 bg-white border-t border-priceai-lightgray px-6 py-4 z-30 w-full shadow-[0_-2px_8px_-2px_rgba(0,0,0,0.04)]">
          <div className="flex items-start justify-between w-full">
            <div className="flex items-start gap-4">
              <div className="text-sm text-priceai-gray">
                Showing {Math.min((currentPage - 1) * pageSize + 1, sortedData.length)} to{' '}
                {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
              </div>
              {pagination.showSizeSelector && (
                <div className="flex items-start gap-2">
                  <span className="text-sm text-priceai-gray">Rows per page:</span>
                  <Select
                    options={[
                      { label: "5", value: "5" },
                      { label: "10", value: "10" },
                      { label: "20", value: "20" },
                      { label: "50", value: "50" }
                    ]}
                    value={pageSize.toString()}
                    onChange={(value) => {
                      setPageSize(Number(value));
                      setCurrentPage(1);
                    }}
                    inputClassName="h-8 w-16 text-sm"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

