'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { DataTableProps, DataTableColumn, DataTableRow, DataTableSort, DataTableFilter } from './types';
import { DataTableToolbar } from './DataTableToolbar';
import { DataTableColumnHeader } from './DataTableColumnHeader';
import { DataTablePagination } from './DataTablePagination';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Loader2,
  FileText,
  Download
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function DataTable<T extends DataTableRow>({
  data,
  columns,
  loading = false,
  pagination,
  onPaginationChange,
  sorting = [],
  onSortingChange,
  filtering = [],
  onFilteringChange,
  selection,
  onSelectionChange,
  searchable = true,
  searchPlaceholder = 'Search...',
  exportable = true,
  exportFormats = ['csv', 'excel', 'pdf'],
  onExport,
  bulkActions = [],
  onBulkAction,
  emptyState,
  className,
  rowClassName,
  onRowClick,
  onRowDoubleClick,
  contextMenu = [],
  onContextMenuAction,
  keyboardNavigation = true,
  virtualScrolling = false,
  stickyHeader = true,
  resizableColumns = false,
}: DataTableProps<T>) {
  const [localSearch, setLocalSearch] = useState('');
  const [focusedRow, setFocusedRow] = useState<number>(-1);
  const [focusedCell, setFocusedCell] = useState<number>(-1);
  const tableRef = useRef<HTMLTableElement>(null);

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search filter
    if (localSearch) {
      result = result.filter(row =>
        columns.some(column => {
          if (column.accessorKey) {
            const value = row[column.accessorKey as string];
            return String(value).toLowerCase().includes(localSearch.toLowerCase());
          }
          return false;
        })
      );
    }

    // Apply column filters
    filtering.forEach(filter => {
      result = result.filter(row => {
        const value = row[filter.column];
        switch (filter.operator) {
          case 'contains':
            return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'startsWith':
            return String(value).toLowerCase().startsWith(String(filter.value).toLowerCase());
          case 'endsWith':
            return String(value).toLowerCase().endsWith(String(filter.value).toLowerCase());
          case 'gt':
            return Number(value) > Number(filter.value);
          case 'lt':
            return Number(value) < Number(filter.value);
          case 'gte':
            return Number(value) >= Number(filter.value);
          case 'lte':
            return Number(value) <= Number(filter.value);
          case 'equals':
          default:
            return value === filter.value;
        }
      });
    });

    return result;
  }, [data, localSearch, filtering, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (sorting.length === 0) return filteredData;

    return [...filteredData].sort((a, b) => {
      for (const sort of sorting) {
        const aValue = a[sort.column];
        const bValue = b[sort.column];
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;
        
        if (comparison !== 0) {
          return sort.direction === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });
  }, [filteredData, sorting]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, pagination]);

  // Handle sorting
  const handleSort = useCallback((columnId: string) => {
    if (!onSortingChange) return;

    const existingSort = sorting.find(s => s.column === columnId);
    let newSorting: DataTableSort[];

    if (!existingSort) {
      newSorting = [...sorting, { column: columnId, direction: 'asc' }];
    } else if (existingSort.direction === 'asc') {
      newSorting = sorting.map(s => 
        s.column === columnId ? { ...s, direction: 'desc' } : s
      );
    } else {
      newSorting = sorting.filter(s => s.column !== columnId);
    }

    onSortingChange(newSorting);
  }, [sorting, onSortingChange]);

  // Handle selection
  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange || !selection) return;

    const allRowIds = paginatedData.map(row => row.id);
    const isAllSelected = allRowIds.every(id => selection.selectedRows.includes(id));

    if (isAllSelected) {
      const newSelectedRows = selection.selectedRows.filter(id => !allRowIds.includes(id));
      onSelectionChange({
        selectedRows: newSelectedRows,
        isAllSelected: false,
        isIndeterminate: newSelectedRows.length > 0,
      });
    } else {
      const newSelectedRows = [...new Set([...selection.selectedRows, ...allRowIds])];
      onSelectionChange({
        selectedRows: newSelectedRows,
        isAllSelected: newSelectedRows.length === data.length,
        isIndeterminate: false,
      });
    }
  }, [paginatedData, selection, onSelectionChange, data.length]);

  const handleSelectRow = useCallback((rowId: string) => {
    if (!onSelectionChange || !selection) return;

    const isSelected = selection.selectedRows.includes(rowId);
    const newSelectedRows = isSelected
      ? selection.selectedRows.filter(id => id !== rowId)
      : [...selection.selectedRows, rowId];

    onSelectionChange({
      selectedRows: newSelectedRows,
      isAllSelected: newSelectedRows.length === data.length,
      isIndeterminate: newSelectedRows.length > 0 && newSelectedRows.length < data.length,
    });
  }, [selection, onSelectionChange, data.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!keyboardNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!tableRef.current?.contains(document.activeElement)) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedRow(prev => Math.min(prev + 1, paginatedData.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedRow(prev => Math.max(prev - 1, 0));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setFocusedCell(prev => Math.min(prev + 1, columns.length - 1));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setFocusedCell(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedRow >= 0 && onRowClick) {
            onRowClick(paginatedData[focusedRow]);
          }
          break;
        case 'Space':
          e.preventDefault();
          if (focusedRow >= 0 && selection) {
            handleSelectRow(paginatedData[focusedRow].id);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keyboardNavigation, focusedRow, focusedCell, paginatedData, columns.length, onRowClick, selection, handleSelectRow]);

  // Render cell content
  const renderCell = useCallback((column: DataTableColumn<T>, row: T) => {
    if (column.cell) {
      return column.cell(row);
    }

    if (column.accessorKey) {
      const value = row[column.accessorKey as string];
      
      switch (column.type) {
        case 'boolean':
          return (
            <Badge variant={value ? 'default' : 'secondary'}>
              {value ? 'Yes' : 'No'}
            </Badge>
          );
        case 'status':
          return (
            <Badge 
              variant={value === 'active' ? 'default' : 'secondary'}
              className={cn(
                value === 'active' && 'status-healthy',
                value === 'inactive' && 'status-degraded',
                value === 'error' && 'status-unhealthy'
              )}
            >
              {String(value)}
            </Badge>
          );
        case 'date':
          return new Date(value).toLocaleDateString();
        case 'number':
          return typeof value === 'number' ? value.toLocaleString() : value;
        default:
          return String(value);
      }
    }

    return null;
  }, []);

  // Export functionality
  const handleExport = useCallback((format: string) => {
    if (onExport) {
      const selectedRows = selection?.selectedRows.length ? selection.selectedRows : undefined;
      onExport(format, selectedRows);
    }
  }, [onExport, selection]);

  const hasSelection = selection && selection.selectedRows.length > 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <DataTableToolbar
        searchable={searchable}
        searchPlaceholder={searchPlaceholder}
        searchValue={localSearch}
        onSearchChange={setLocalSearch}
        exportable={exportable}
        exportFormats={exportFormats}
        onExport={handleExport}
        bulkActions={bulkActions}
        selectedCount={selection?.selectedRows.length || 0}
        onBulkAction={onBulkAction}
        filtering={filtering}
        onFilteringChange={onFilteringChange}
        columns={columns}
      />

      {/* Table Container */}
      <div className="relative">
        <div className="rounded-md border bg-card overflow-hidden">
          <div className="overflow-auto max-h-[600px]">
            <table 
              ref={tableRef}
              className="w-full caption-bottom text-sm"
              tabIndex={keyboardNavigation ? 0 : undefined}
            >
              {/* Header */}
              <thead className={cn(stickyHeader && 'sticky top-0 z-10 bg-card')}>
                <tr className="border-b transition-colors hover:bg-muted/50">
                  {/* Selection column */}
                  {selection && (
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-12">
                      <Checkbox
                        checked={selection.isAllSelected}
                        indeterminate={selection.isIndeterminate}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all rows"
                      />
                    </th>
                  )}
                  
                  {/* Column headers */}
                  {columns.map((column, index) => (
                    <DataTableColumnHeader
                      key={column.id}
                      column={column}
                      sorting={sorting}
                      onSort={handleSort}
                      className={cn(
                        focusedCell === index && 'ring-2 ring-primary',
                        column.align === 'center' && 'text-center',
                        column.align === 'right' && 'text-right'
                      )}
                      style={{ width: column.width }}
                    />
                  ))}
                  
                  {/* Actions column */}
                  {contextMenu.length > 0 && (
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-12">
                      <span className="sr-only">Actions</span>
                    </th>
                  )}
                </tr>
              </thead>

              {/* Body */}
              <tbody>
                {loading ? (
                  <tr>
                    <td 
                      colSpan={columns.length + (selection ? 1 : 0) + (contextMenu.length > 0 ? 1 : 0)}
                      className="h-24 text-center"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td 
                      colSpan={columns.length + (selection ? 1 : 0) + (contextMenu.length > 0 ? 1 : 0)}
                      className="h-24 text-center"
                    >
                      {emptyState || (
                        <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                          <FileText className="h-8 w-8" />
                          <span>No data available</span>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((row, rowIndex) => (
                    <tr
                      key={row.id}
                      className={cn(
                        'border-b transition-colors hover:bg-muted/50',
                        focusedRow === rowIndex && 'bg-muted',
                        selection?.selectedRows.includes(row.id) && 'bg-muted/30',
                        rowClassName?.(row),
                        (onRowClick || onRowDoubleClick) && 'cursor-pointer'
                      )}
                      onClick={() => onRowClick?.(row)}
                      onDoubleClick={() => onRowDoubleClick?.(row)}
                    >
                      {/* Selection cell */}
                      {selection && (
                        <td className="px-4 py-3 align-middle">
                          <Checkbox
                            checked={selection.selectedRows.includes(row.id)}
                            onCheckedChange={() => handleSelectRow(row.id)}
                            aria-label={`Select row ${rowIndex + 1}`}
                          />
                        </td>
                      )}
                      
                      {/* Data cells */}
                      {columns.map((column, cellIndex) => (
                        <td
                          key={column.id}
                          className={cn(
                            'px-4 py-3 align-middle',
                            focusedRow === rowIndex && focusedCell === cellIndex && 'ring-2 ring-primary',
                            column.align === 'center' && 'text-center',
                            column.align === 'right' && 'text-right'
                          )}
                          style={{ width: column.width }}
                        >
                          {renderCell(column, row)}
                        </td>
                      ))}
                      
                      {/* Actions cell */}
                      {contextMenu.length > 0 && (
                        <td className="px-4 py-3 align-middle">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                aria-label={`Actions for row ${rowIndex + 1}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {contextMenu.map((item) => (
                                item.separator ? (
                                  <DropdownMenuSeparator key={item.id} />
                                ) : (
                                  <DropdownMenuItem
                                    key={item.id}
                                    disabled={item.disabled}
                                    onClick={() => onContextMenuAction?.(item.id, row)}
                                  >
                                    {item.icon && <span className="mr-2">{item.icon}</span>}
                                    {item.label}
                                  </DropdownMenuItem>
                                )
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <DataTablePagination
          pagination={pagination}
          onPaginationChange={onPaginationChange}
          totalFiltered={sortedData.length}
          selectedCount={selection?.selectedRows.length || 0}
        />
      )}
    </div>
  );
}