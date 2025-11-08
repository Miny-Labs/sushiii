'use client';

import React, { useState } from 'react';
import { ExecutiveDashboard } from '@/components/shared/professional/Dashboard';
import { DashboardConfig, WidgetConfig, DashboardLayout } from '@/components/shared/professional/Dashboard/types';
import { 
  Users, 
  DollarSign, 
  Target, 
  TrendingUp, 
  BarChart3, 
  Activity,
  AlertCircle,
  Zap
} from 'lucide-react';

// Sample dashboard configuration
const initialConfig: DashboardConfig = {
  id: 'executive-dashboard',
  title: 'Executive Dashboard',
  description: 'Real-time insights and key performance indicators',
  currentLayoutId: 'default-layout',
  layouts: [
    {
      id: 'default-layout',
      name: 'Default Layout',
      description: 'Standard executive dashboard layout',
      isDefault: true,
      widgets: [
        {
          id: 'total-users-widget',
          type: 'metric-card',
          title: 'Total Users',
          description: 'Active users in the system',
          icon: <Users className="h-4 w-4" />,
          size: 'small',
          position: { x: 0, y: 0, w: 3, h: 3 },
          config: {
            showHeader: true,
            allowResize: true,
            allowMove: true,
            allowRemove: true,
          },
          permissions: {
            view: true,
            edit: true,
            delete: true,
          },
        },
        {
          id: 'revenue-widget',
          type: 'metric-card',
          title: 'Revenue',
          description: 'Total revenue this month',
          icon: <DollarSign className="h-4 w-4" />,
          size: 'small',
          position: { x: 3, y: 0, w: 3, h: 3 },
          config: {
            showHeader: true,
            allowResize: true,
            allowMove: true,
            allowRemove: true,
          },
          permissions: {
            view: true,
            edit: true,
            delete: true,
          },
        },
        {
          id: 'conversion-widget',
          type: 'metric-card',
          title: 'Conversion Rate',
          description: 'Current conversion rate',
          icon: <Target className="h-4 w-4" />,
          size: 'small',
          position: { x: 6, y: 0, w: 3, h: 3 },
          config: {
            showHeader: true,
            allowResize: true,
            allowMove: true,
            allowRemove: true,
          },
          permissions: {
            view: true,
            edit: true,
            delete: true,
          },
        },
        {
          id: 'quick-actions-widget',
          type: 'quick-actions',
          title: 'Quick Actions',
          description: 'Commonly used actions',
          icon: <Zap className="h-4 w-4" />,
          size: 'small',
          position: { x: 9, y: 0, w: 3, h: 3 },
          config: {
            showHeader: true,
            allowResize: true,
            allowMove: true,
            allowRemove: true,
          },
          permissions: {
            view: true,
            edit: true,
            delete: true,
          },
        },
        {
          id: 'trend-chart-widget',
          type: 'chart',
          title: 'Trend Analysis',
          description: 'Data trends over time',
          icon: <TrendingUp className="h-4 w-4" />,
          size: 'large',
          position: { x: 0, y: 3, w: 6, h: 4 },
          config: {
            showHeader: true,
            allowResize: true,
            allowMove: true,
            allowRemove: true,
          },
          permissions: {
            view: true,
            edit: true,
            delete: true,
          },
        },
        {
          id: 'activity-widget',
          type: 'list',
          title: 'Recent Activity',
          description: 'Latest system activities',
          icon: <Activity className="h-4 w-4" />,
          size: 'medium',
          position: { x: 6, y: 3, w: 3, h: 4 },
          config: {
            showHeader: true,
            allowResize: true,
            allowMove: true,
            allowRemove: true,
          },
          permissions: {
            view: true,
            edit: true,
            delete: true,
          },
        },
        {
          id: 'alerts-widget',
          type: 'alert',
          title: 'System Alerts',
          description: 'Important system notifications',
          icon: <AlertCircle className="h-4 w-4" />,
          size: 'medium',
          position: { x: 9, y: 3, w: 3, h: 4 },
          config: {
            showHeader: true,
            allowResize: true,
            allowMove: true,
            allowRemove: true,
          },
          permissions: {
            view: true,
            edit: true,
            delete: true,
          },
        },
      ],
      gridConfig: {
        cols: 12,
        rowHeight: 80,
        margin: [16, 16],
        containerPadding: [16, 16],
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ],
  settings: {
    theme: 'light',
    autoRefresh: true,
    refreshInterval: 30,
    showGrid: false,
    allowCustomization: true,
    compactMode: false,
  },
  permissions: {
    canEdit: true,
    canShare: true,
    canExport: true,
    canCreateLayouts: true,
  },
};

export default function DashboardPage() {
  const [dashboardConfig, setDashboardConfig] = useState<DashboardConfig>(initialConfig);

  const handleConfigChange = (newConfig: DashboardConfig) => {
    setDashboardConfig(newConfig);
  };

  const handleWidgetAdd = (widget: WidgetConfig) => {
    const currentLayout = dashboardConfig.layouts.find(
      layout => layout.id === dashboardConfig.currentLayoutId
    );
    
    if (currentLayout) {
      const updatedLayout = {
        ...currentLayout,
        widgets: [...currentLayout.widgets, widget],
        updatedAt: new Date(),
      };
      
      const updatedConfig = {
        ...dashboardConfig,
        layouts: dashboardConfig.layouts.map(layout => 
          layout.id === currentLayout.id ? updatedLayout : layout
        ),
      };
      
      setDashboardConfig(updatedConfig);
    }
  };

  const handleWidgetUpdate = (widgetId: string, updates: Partial<WidgetConfig>) => {
    const currentLayout = dashboardConfig.layouts.find(
      layout => layout.id === dashboardConfig.currentLayoutId
    );
    
    if (currentLayout) {
      const updatedLayout = {
        ...currentLayout,
        widgets: currentLayout.widgets.map(widget => 
          widget.id === widgetId ? { ...widget, ...updates } : widget
        ),
        updatedAt: new Date(),
      };
      
      const updatedConfig = {
        ...dashboardConfig,
        layouts: dashboardConfig.layouts.map(layout => 
          layout.id === currentLayout.id ? updatedLayout : layout
        ),
      };
      
      setDashboardConfig(updatedConfig);
    }
  };

  const handleWidgetRemove = (widgetId: string) => {
    const currentLayout = dashboardConfig.layouts.find(
      layout => layout.id === dashboardConfig.currentLayoutId
    );
    
    if (currentLayout) {
      const updatedLayout = {
        ...currentLayout,
        widgets: currentLayout.widgets.filter(widget => widget.id !== widgetId),
        updatedAt: new Date(),
      };
      
      const updatedConfig = {
        ...dashboardConfig,
        layouts: dashboardConfig.layouts.map(layout => 
          layout.id === currentLayout.id ? updatedLayout : layout
        ),
      };
      
      setDashboardConfig(updatedConfig);
    }
  };

  const handleLayoutChange = (layoutId: string) => {
    setDashboardConfig(prev => ({
      ...prev,
      currentLayoutId: layoutId,
    }));
  };

  const handleLayoutSave = (layout: DashboardLayout) => {
    setDashboardConfig(prev => ({
      ...prev,
      layouts: [...prev.layouts, layout],
    }));
  };

  const handleLayoutDelete = (layoutId: string) => {
    setDashboardConfig(prev => ({
      ...prev,
      layouts: prev.layouts.filter(layout => layout.id !== layoutId),
    }));
  };

  const handleDataRefresh = async (widgetId?: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Refreshing data for:', widgetId || 'all widgets');
  };

  return (
    <div className="container mx-auto p-6">
      <ExecutiveDashboard
        config={dashboardConfig}
        onConfigChange={handleConfigChange}
        onWidgetAdd={handleWidgetAdd}
        onWidgetUpdate={handleWidgetUpdate}
        onWidgetRemove={handleWidgetRemove}
        onLayoutChange={handleLayoutChange}
        onLayoutSave={handleLayoutSave}
        onLayoutDelete={handleLayoutDelete}
        onDataRefresh={handleDataRefresh}
      />
    </div>
  );
}