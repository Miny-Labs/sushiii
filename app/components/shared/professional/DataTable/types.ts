import { ReactNode } from 'react';

export interface DataTableColumn<T = any> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  type?: 'text' | 'number' | 'date' | 'boolean' | 'status' | 'actions';
}

export interface DataTableRow {
  id: string;
  [key: string]: any;
}

export interface DataTableFilter {
  column: string;
  value: any;
  operator?: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte';
}

export interface DataTableSort {
  column: string;
  direction: 'asc' | 'desc';
}

export interface DataTablePagination {
  page: number;
  pageSize: number;
  total: number;
}

export interface DataTableSelection {
  selectedRows: string[];
  isAllSelected: boolean;
  isIndeterminate: boolean;
}

export interface DataTableProps<T = DataTableRow> {
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  pagination?: DataTablePagination;
  onPaginationChange?: (pagination: DataTablePagination) => void;
  sorting?: DataTableSort[];
  onSortingChange?: (sorting: DataTableSort[]) => void;
  filtering?: DataTableFilter[];
  onFilteringChange?: (filtering: DataTableFilter[]) => void;
  selection?: DataTableSelection;
  onSelectionChange?: (selection: DataTableSelection) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  exportable?: boolean;
  exportFormats?: ('csv' | 'excel' | 'pdf')[];
  onExport?: (format: string, selectedRows?: string[]) => void;
  bulkActions?: BulkAction[];
  onBulkAction?: (action: string, selectedRows: string[]) => void;
  emptyState?: ReactNode;
  className?: string;
  rowClassName?: (row: T) => string;
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  contextMenu?: ContextMenuItem[];
  onContextMenuAction?: (action: string, row: T) => void;
  keyboardNavigation?: boolean;
  virtualScrolling?: boolean;
  stickyHeader?: boolean;
  resizableColumns?: boolean;
}

export interface BulkAction {
  id: string;
  label: string;
  icon?: ReactNode;
  variant?: 'default' | 'destructive' | 'outline';
  disabled?: boolean;
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
}

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  separator?: boolean;
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  filename?: string;
  includeHeaders?: boolean;
  selectedOnly?: boolean;
  customFields?: string[];
}