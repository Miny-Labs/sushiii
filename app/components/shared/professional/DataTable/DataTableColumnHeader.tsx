'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { DataTableColumn, DataTableSort } from './types';
import { ArrowUpDown, ArrowUp, ArrowDown, EyeOff } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DataTableColumnHeaderProps<T = any> {
  column: DataTableColumn<T>;
  sorting: DataTableSort[];
  onSort?: (columnId: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function DataTableColumnHeader<T>({
  column,
  sorting,
  onSort,
  className,
  style,
}: DataTableColumnHeaderProps<T>) {
  const sortState = sorting.find(s => s.column === column.id);
  const isSorted = !!sortState;
  const sortDirection = sortState?.direction;

  const handleSort = () => {
    if (column.sortable && onSort) {
      onSort(column.id);
    }
  };

  if (!column.sortable) {
    return (
      <th
        className={cn(
          'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
          className
        )}
        style={style}
      >
        <span className="font-expanded text-sm font-semibold tracking-wide">
          {column.header}
        </span>
      </th>
    );
  }

  return (
    <th
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
        className
      )}
      style={style}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              '-ml-3 h-8 data-[state=open]:bg-accent font-expanded text-sm font-semibold tracking-wide',
              isSorted && 'text-foreground'
            )}
          >
            <span>{column.header}</span>
            {isSorted ? (
              sortDirection === 'desc' ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUp className="ml-2 h-4 w-4" />
              )
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={handleSort}>
            <ArrowUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSort}>
            <ArrowDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
            Desc
          </DropdownMenuItem>
          {isSorted && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSort}>
                <EyeOff className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
                Clear Sort
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </th>
  );
}