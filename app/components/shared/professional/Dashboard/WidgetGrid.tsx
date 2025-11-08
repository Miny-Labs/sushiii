'use client';
import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { DashboardWidget } from './DashboardWidget';
import { WidgetConfig, GridLayoutItem, WidgetData } from './types';
import dynamic from 'next/dynamic';

// Dynamically import the client-only grid component
const ClientOnlyWidgetGrid = dynamic(
  () => import('./ClientOnlyWidgetGrid').then(mod => ({ default: mod.ClientOnlyWidgetGrid })),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse h-64 bg-muted rounded-lg" />
  }
);

interface WidgetGridProps {
  widgets: WidgetConfig[];
  widgetData: Record<string, WidgetData>;
  onLayoutChange?: (widgets: WidgetConfig[]) => void;
  onWidgetUpdate?: (widgetId: string, updates: Partial<WidgetConfig>) => void;
  onWidgetRemove?: (widgetId: string) => void;
  onWidgetRefresh?: (widgetId: string) => void;
  readonly?: boolean;
  loading?: boolean;
  showGrid?: boolean;
  compactMode?: boolean;
  className?: string;
}

export function WidgetGrid(props: WidgetGridProps) {
  return <ClientOnlyWidgetGrid {...props} />;
}