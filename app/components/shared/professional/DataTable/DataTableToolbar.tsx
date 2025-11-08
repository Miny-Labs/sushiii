'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DataTableColumn, DataTableFilter, BulkAction } from './types';
import { 
  Search, 
  Download, 
  Filter, 
  X, 
  FileText, 
  FileSpreadsheet, 
  FileImage,
  Trash2,
  Edit,
  Archive
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DataTableToolbarProps {
  searchable?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  exportable?: boolean;
  exportFormats?: ('csv' | 'excel' | 'pdf')[];
  onExport?: (format: string) => void;
  bulkActions?: BulkAction[];
  selectedCount?: number;
  onBulkAction?: (action: string, selectedRows: string[]) => void;
  filtering?: DataTableFilter[];
  onFilteringChange?: (filtering: DataTableFilter[]) => void;
  columns?: DataTableColumn[];
}

export function DataTableToolbar({
  searchable = true,
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  exportable = true,
  exportFormats = ['csv', 'excel', 'pdf'],
  onExport,
  bulkActions = [],
  selectedCount = 0,
  onBulkAction,
  filtering = [],
  onFilteringChange,
  columns = [],
}: DataTableToolbarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleClearFilters = () => {
    if (onFilteringChange) {
      onFilteringChange([]);
    }
    if (onSearchChange) {
      onSearchChange('');
    }
  };

  const handleRemoveFilter = (index: number) => {
    if (onFilteringChange) {
      const newFiltering = filtering.filter((_, i) => i !== index);
      onFilteringChange(newFiltering);
    }
  };

  const getExportIcon = (format: string) => {
    switch (format) {
      case 'csv':
        return <FileText className="mr-2 h-4 w-4" />;
      case 'excel':
        return <FileSpreadsheet className="mr-2 h-4 w-4" />;
      case 'pdf':
        return <FileImage className="mr-2 h-4 w-4" />;
      default:
        return <Download className="mr-2 h-4 w-4" />;
    }
  };

  const getBulkActionIcon = (action: BulkAction) => {
    switch (action.id) {
      case 'delete':
        return <Trash2 className="mr-2 h-4 w-4" />;
      case 'edit':
        return <Edit className="mr-2 h-4 w-4" />;
      case 'archive':
        return <Archive className="mr-2 h-4 w-4" />;
      default:
        return action.icon;
    }
  };

  const hasActiveFilters = filtering.length > 0 || searchValue.length > 0;

  return (
    <div className="space-y-4">
      {/* Main toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          {/* Search */}
          {searchable && (
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="pl-8 font-semi-expanded"
              />
            </div>
          )}

          {/* Filter toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'font-expanded text-sm',
              (showFilters || filtering.length > 0) && 'bg-accent'
            )}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter
            {filtering.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {filtering.length}
              </Badge>
            )}
          </Button>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="font-expanded text-sm"
            >
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Bulk actions */}
          {selectedCount > 0 && bulkActions.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground font-semi-expanded">
                {selectedCount} selected
              </span>
              {bulkActions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant || 'outline'}
                  size="sm"
                  disabled={action.disabled}
                  onClick={() => onBulkAction?.(action.id, [])}
                  className="font-expanded text-sm"
                >
                  {getBulkActionIcon(action)}
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          {/* Export */}
          {exportable && exportFormats.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="font-expanded text-sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Export as</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {exportFormats.map((format) => (
                  <DropdownMenuItem
                    key={format}
                    onClick={() => onExport?.(format)}
                  >
                    {getExportIcon(format)}
                    {format.toUpperCase()}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Active filters */}
      {filtering.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground font-semi-expanded">
            Active filters:
          </span>
          {filtering.map((filter, index) => {
            const column = columns.find(col => col.id === filter.column);
            return (
              <Badge
                key={index}
                variant="secondary"
                className="gap-1 font-semi-expanded"
              >
                {column?.header || filter.column}: {String(filter.value)}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => handleRemoveFilter(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}

      {/* Filter panel */}
      {showFilters && (
        <div className="rounded-lg border bg-card p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold font-expanded">Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {columns
                .filter(column => column.filterable)
                .map((column) => (
                  <div key={column.id} className="space-y-2">
                    <label className="text-sm font-medium font-expanded">
                      {column.header}
                    </label>
                    <Input
                      placeholder={`Filter by ${column.header.toLowerCase()}...`}
                      className="font-semi-expanded"
                      onChange={(e) => {
                        if (onFilteringChange) {
                          const existingFilterIndex = filtering.findIndex(f => f.column === column.id);
                          const newFiltering = [...filtering];
                          
                          if (e.target.value) {
                            const newFilter = {
                              column: column.id,
                              value: e.target.value,
                              operator: 'contains' as const,
                            };
                            
                            if (existingFilterIndex >= 0) {
                              newFiltering[existingFilterIndex] = newFilter;
                            } else {
                              newFiltering.push(newFilter);
                            }
                          } else if (existingFilterIndex >= 0) {
                            newFiltering.splice(existingFilterIndex, 1);
                          }
                          
                          onFilteringChange(newFiltering);
                        }
                      }}
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}