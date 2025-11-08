'use client';
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { DashboardWidget } from './DashboardWidget';
import { WidgetConfig, GridLayoutItem, WidgetData } from './types';

interface ClientOnlyWidgetGridProps {
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

export function ClientOnlyWidgetGrid({
  widgets,
  widgetData,
  onLayoutChange,
  onWidgetUpdate,
  onWidgetRemove,
  onWidgetRefresh,
  readonly = false,
  loading = false,
  showGrid = false,
  compactMode = false,
  className,
}: ClientOnlyWidgetGridProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [ResponsiveGridLayout, setResponsiveGridLayout] = useState<any>(null);

  // Load react-grid-layout only on client side
  useEffect(() => {
    const loadGridLayout = async () => {
      try {
        const { Responsive, WidthProvider } = await import('react-grid-layout');
        setResponsiveGridLayout(WidthProvider(Responsive));
      } catch (error) {
        console.error('Failed to load react-grid-layout:', error);
      }
    };
    loadGridLayout();
  }, []);

  // Convert widget configs to grid layout items
  const layouts = useMemo(() => {
    const layout = widgets.map(widget => ({
      i: widget.id,
      x: widget.position.x,
      y: widget.position.y,
      w: widget.position.w,
      h: widget.position.h,
      minW: getSizeConstraints(widget.size).minW,
      minH: getSizeConstraints(widget.size).minH,
      maxW: getSizeConstraints(widget.size).maxW,
      maxH: getSizeConstraints(widget.size).maxH,
      static: readonly || !widget.config?.allowMove,
      isDraggable: !readonly && widget.config?.allowMove !== false,
      isResizable: !readonly && widget.config?.allowResize !== false,
    }));

    return {
      lg: layout,
      md: layout,
      sm: layout.map(item => ({ ...item, w: Math.min(item.w, 6) })),
      xs: layout.map(item => ({ ...item, w: Math.min(item.w, 4) })),
      xxs: layout.map(item => ({ ...item, w: Math.min(item.w, 2) })),
    };
  }, [widgets, readonly]);

  // Handle layout changes from drag/resize
  const handleLayoutChange = useCallback((layout: any[], layouts: any) => {
    if (readonly || !onLayoutChange) return;

    const updatedWidgets = widgets.map(widget => {
      const layoutItem = layout.find(item => item.i === widget.id);
      if (!layoutItem) return widget;

      return {
        ...widget,
        position: {
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h,
        },
      };
    });

    onLayoutChange(updatedWidgets);
  }, [widgets, onLayoutChange, readonly]);

  const handleWidgetUpdate = useCallback((widgetId: string, updates: Partial<WidgetConfig>) => {
    onWidgetUpdate?.(widgetId, updates);
  }, [onWidgetUpdate]);

  const handleWidgetRemove = useCallback((widgetId: string) => {
    onWidgetRemove?.(widgetId);
  }, [onWidgetRemove]);

  const handleWidgetRefresh = useCallback((widgetId: string) => {
    onWidgetRefresh?.(widgetId);
  }, [onWidgetRefresh]);

  // Grid configuration
  const gridConfig = {
    className: cn(
      'widget-grid',
      showGrid && 'show-grid',
      isDragging && 'dragging',
      compactMode && 'compact-mode',
      className
    ),
    layouts,
    breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
    cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
    rowHeight: compactMode ? 60 : 80,
    margin: compactMode ? [8, 8] : [16, 16] as [number, number],
    containerPadding: [16, 16] as [number, number],
    onLayoutChange: handleLayoutChange,
    onDragStart: () => setIsDragging(true),
    onDragStop: () => setIsDragging(false),
    onResizeStart: () => setIsDragging(true),
    onResizeStop: () => setIsDragging(false),
    isDraggable: !readonly,
    isResizable: !readonly,
    compactType: compactMode ? 'vertical' : null,
    preventCollision: !compactMode,
  };

  if (widgets.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground font-expanded">No widgets added yet</p>
          <p className="text-sm text-muted-foreground font-semi-expanded">
            Add widgets from the library to get started
          </p>
        </div>
      </div>
    );
  }

  // Fallback to simple grid if ResponsiveGridLayout is not loaded
  if (!ResponsiveGridLayout) {
    return (
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
        {widgets.map(widget => (
          <div key={widget.id} className="widget-container">
            <DashboardWidget
              config={widget}
              data={widgetData[widget.id]}
              onUpdate={(updates) => handleWidgetUpdate(widget.id, updates)}
              onRemove={() => handleWidgetRemove(widget.id)}
              onRefresh={() => handleWidgetRefresh(widget.id)}
              readonly={readonly}
              loading={loading}
              className="h-full"
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <ResponsiveGridLayout {...gridConfig}>
        {widgets.map(widget => (
          <div key={widget.id} className="widget-container">
            <DashboardWidget
              config={widget}
              data={widgetData[widget.id]}
              onUpdate={(updates) => handleWidgetUpdate(widget.id, updates)}
              onRemove={() => handleWidgetRemove(widget.id)}
              onRefresh={() => handleWidgetRefresh(widget.id)}
              readonly={readonly}
              loading={loading}
              className="h-full"
            />
          </div>
        ))}
      </ResponsiveGridLayout>
      {/* Grid overlay for visual feedback */}
      {showGrid && (
        <style jsx global>{`
          .widget-grid.show-grid {
            background-image: 
              linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px);
            background-size: ${gridConfig.cols.lg * 100 / 12}px ${gridConfig.rowHeight + gridConfig.margin[1]}px;
          }
          .widget-grid.dragging .widget-container {
            transition: none !important;
          }
          .widget-container {
            transition: all 0.2s ease;
          }
          .react-grid-item.react-grid-placeholder {
            background: hsl(var(--primary) / 0.1) !important;
            border: 2px dashed hsl(var(--primary)) !important;
            border-radius: 8px !important;
          }
          .react-grid-item > .react-resizable-handle::after {
            border-right: 2px solid hsl(var(--primary)) !important;
            border-bottom: 2px solid hsl(var(--primary)) !important;
          }
          .react-grid-item.react-grid-placeholder {
            opacity: 0.3;
          }
        `}</style>
      )}
    </div>
  );
}

// Helper function to get size constraints based on widget size
function getSizeConstraints(size: WidgetConfig['size']) {
  switch (size) {
    case 'small':
      return { minW: 2, minH: 2, maxW: 4, maxH: 4 };
    case 'medium':
      return { minW: 3, minH: 3, maxW: 6, maxH: 6 };
    case 'large':
      return { minW: 4, minH: 4, maxW: 8, maxH: 8 };
    case 'extra-large':
      return { minW: 6, minH: 4, maxW: 12, maxH: 12 };
    default:
      return { minW: 2, minH: 2, maxW: 12, maxH: 12 };
  }
}