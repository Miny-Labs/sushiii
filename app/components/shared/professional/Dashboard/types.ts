import { ReactNode } from 'react';

export type WidgetType = 
  | 'metric-card'
  | 'chart'
  | 'table'
  | 'list'
  | 'progress'
  | 'alert'
  | 'calendar'
  | 'activity-feed'
  | 'quick-actions'
  | 'custom';

export interface WidgetData {
  [key: string]: any;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  description?: string;
  icon?: ReactNode;
  size: 'small' | 'medium' | 'large' | 'extra-large';
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  data?: WidgetData;
  refreshInterval?: number; // in seconds
  dataSource?: string;
  config?: {
    showHeader?: boolean;
    showFooter?: boolean;
    allowResize?: boolean;
    allowMove?: boolean;
    allowRemove?: boolean;
    customProps?: Record<string, any>;
  };
  permissions?: {
    view: boolean;
    edit: boolean;
    delete: boolean;
  };
}

export interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  widgets: WidgetConfig[];
  gridConfig: {
    cols: number;
    rowHeight: number;
    margin: [number, number];
    containerPadding: [number, number];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardConfig {
  id: string;
  title: string;
  description?: string;
  layouts: DashboardLayout[];
  currentLayoutId: string;
  settings: {
    theme: 'light' | 'dark' | 'auto';
    autoRefresh: boolean;
    refreshInterval: number;
    showGrid: boolean;
    allowCustomization: boolean;
    compactMode: boolean;
  };
  permissions: {
    canEdit: boolean;
    canShare: boolean;
    canExport: boolean;
    canCreateLayouts: boolean;
  };
}

export interface WidgetLibraryItem {
  id: string;
  type: WidgetType;
  name: string;
  description: string;
  icon: ReactNode;
  category: string;
  defaultSize: WidgetConfig['size'];
  defaultConfig: Partial<WidgetConfig>;
  preview?: ReactNode;
}

export interface DashboardProps {
  config: DashboardConfig;
  onConfigChange?: (config: DashboardConfig) => void;
  onWidgetAdd?: (widget: WidgetConfig) => void;
  onWidgetUpdate?: (widgetId: string, updates: Partial<WidgetConfig>) => void;
  onWidgetRemove?: (widgetId: string) => void;
  onLayoutChange?: (layoutId: string) => void;
  onLayoutSave?: (layout: DashboardLayout) => void;
  onLayoutDelete?: (layoutId: string) => void;
  onDataRefresh?: (widgetId?: string) => void;
  className?: string;
  readonly?: boolean;
  loading?: boolean;
}

export interface WidgetProps {
  config: WidgetConfig;
  data?: WidgetData;
  onUpdate?: (updates: Partial<WidgetConfig>) => void;
  onRemove?: () => void;
  onRefresh?: () => void;
  readonly?: boolean;
  loading?: boolean;
  className?: string;
}

export interface GridLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
  isDraggable?: boolean;
  isResizable?: boolean;
}