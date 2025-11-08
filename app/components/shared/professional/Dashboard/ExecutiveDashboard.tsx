'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { DashboardProps, DashboardConfig, WidgetConfig, DashboardLayout, WidgetData } from './types';
import { WidgetGrid } from './WidgetGrid';
import { WidgetLibrary } from './WidgetLibrary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Layout, 
  Plus, 
  MoreVertical,
  Grid3X3,
  Maximize,
  Download,
  Share,
  Trash2,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export function ExecutiveDashboard({
  config,
  onConfigChange,
  onWidgetAdd,
  onWidgetUpdate,
  onWidgetRemove,
  onLayoutChange,
  onLayoutSave,
  onLayoutDelete,
  onDataRefresh,
  className,
  readonly = false,
  loading = false,
}: DashboardProps) {
  const [widgetData, setWidgetData] = useState<Record<string, WidgetData>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showLayoutDialog, setShowLayoutDialog] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState('');
  const [editingSettings, setEditingSettings] = useState(false);
  const [localSettings, setLocalSettings] = useState(config.settings);

  // Get current layout
  const currentLayout = useMemo(() => {
    return config.layouts.find(layout => layout.id === config.currentLayoutId) || config.layouts[0];
  }, [config.layouts, config.currentLayoutId]);

  // Mock data for widgets (in real app, this would come from APIs)
  useEffect(() => {
    const mockData: Record<string, WidgetData> = {
      'total-users': {
        title: 'Total Users',
        value: '12,543',
        change: '+12.5%',
        trend: 'up',
        icon: '👥',
      },
      'revenue': {
        title: 'Revenue',
        value: '$45,231',
        change: '+8.2%',
        trend: 'up',
        icon: '💰',
      },
      'conversion-rate': {
        title: 'Conversion Rate',
        value: '3.24%',
        change: '-0.5%',
        trend: 'down',
        icon: '🎯',
      },
      'line-chart': {
        chartType: 'line',
        chartData: [
          { name: 'Jan', value: 400 },
          { name: 'Feb', value: 300 },
          { name: 'Mar', value: 600 },
          { name: 'Apr', value: 800 },
          { name: 'May', value: 700 },
          { name: 'Jun', value: 900 },
        ],
        chartConfig: {
          dataKey: 'value',
          stroke: '#8884d8',
        },
      },
      'activity-list': {
        items: [
          { title: 'New user registered', value: '2m ago', icon: '👤' },
          { title: 'Payment processed', value: '5m ago', icon: '💳' },
          { title: 'Report generated', value: '10m ago', icon: '📊' },
          { title: 'System backup completed', value: '1h ago', icon: '💾' },
        ],
      },
      'system-alerts': {
        alerts: [
          {
            title: 'High CPU Usage',
            description: 'Server CPU usage is above 85%',
            severity: 'high',
            timestamp: '2 minutes ago',
          },
          {
            title: 'Low Disk Space',
            description: 'Database server disk space is below 10%',
            severity: 'medium',
            timestamp: '15 minutes ago',
          },
        ],
      },
      'quick-actions': {
        actions: [
          { label: 'Create Report', icon: '📊', onClick: () => toast.success('Creating report...') },
          { label: 'Export Data', icon: '📤', onClick: () => toast.success('Exporting data...') },
          { label: 'Send Alert', icon: '🚨', onClick: () => toast.success('Alert sent!') },
          { label: 'Backup System', icon: '💾', onClick: () => toast.success('Backup started...') },
        ],
      },
    };

    // Simulate data for all widgets
    const allWidgetData: Record<string, WidgetData> = {};
    currentLayout?.widgets.forEach(widget => {
      allWidgetData[widget.id] = mockData[widget.type] || mockData[widget.id] || {};
    });

    setWidgetData(allWidgetData);
  }, [currentLayout]);

  // Handle widget operations
  const handleWidgetAdd = useCallback((widget: WidgetConfig) => {
    // Find available position
    const existingPositions = currentLayout?.widgets?.map(w => ({ x: w.position.x, y: w.position.y })) || [];
    let x = 0, y = 0;
    
    // Simple positioning logic - find first available spot
    while (existingPositions.length > 0 && existingPositions.some(pos => pos.x === x && pos.y === y)) {
      x += widget.position.w;
      if (x >= 12) {
        x = 0;
        y += widget.position.h;
      }
    }
    
    const positionedWidget = {
      ...widget,
      position: { ...widget.position, x, y },
    };
    
    onWidgetAdd?.(positionedWidget);
    toast.success(`${widget.title} widget added!`);
  }, [currentLayout, onWidgetAdd]);

  const handleWidgetUpdate = useCallback((widgetId: string, updates: Partial<WidgetConfig>) => {
    onWidgetUpdate?.(widgetId, updates);
  }, [onWidgetUpdate]);

  const handleWidgetRemove = useCallback((widgetId: string) => {
    const widget = currentLayout?.widgets.find(w => w.id === widgetId);
    onWidgetRemove?.(widgetId);
    toast.success(`${widget?.title || 'Widget'} removed!`);
  }, [currentLayout, onWidgetRemove]);

  const handleLayoutChange = useCallback((widgets: WidgetConfig[]) => {
    if (!currentLayout) return;
    
    const updatedLayout: DashboardLayout = {
      ...currentLayout,
      widgets,
      updatedAt: new Date(),
    };
    
    onLayoutChange?.(updatedLayout.id);
  }, [currentLayout, onLayoutChange]);

  const handleDataRefresh = useCallback(async (widgetId?: string) => {
    setIsRefreshing(true);
    try {
      await onDataRefresh?.(widgetId);
      toast.success(widgetId ? 'Widget refreshed!' : 'Dashboard refreshed!');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setIsRefreshing(false);
    }
  }, [onDataRefresh]);

  const handleSaveLayout = useCallback(() => {
    if (!newLayoutName.trim() || !currentLayout) return;
    
    const newLayout: DashboardLayout = {
      ...currentLayout,
      id: `layout-${Date.now()}`,
      name: newLayoutName,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    onLayoutSave?.(newLayout);
    setNewLayoutName('');
    setShowLayoutDialog(false);
    toast.success(`Layout "${newLayoutName}" saved!`);
  }, [newLayoutName, currentLayout, onLayoutSave]);

  const handleSettingsUpdate = useCallback(() => {
    const updatedConfig = {
      ...config,
      settings: localSettings,
    };
    onConfigChange?.(updatedConfig);
    setEditingSettings(false);
    toast.success('Settings updated!');
  }, [config, localSettings, onConfigChange]);

  if (!currentLayout) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground font-expanded">No dashboard layout found</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold font-expanded">{config.title}</h1>
          {config.description && (
            <p className="text-muted-foreground font-semi-expanded">
              {config.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Auto-refresh indicator */}
          {config.settings.autoRefresh && (
            <Badge variant="outline" className="gap-1 font-semi-expanded">
              <RefreshCw className="h-3 w-3" />
              Auto-refresh: {config.settings.refreshInterval}s
            </Badge>
          )}
          
          {/* Layout selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 font-expanded">
                <Layout className="h-4 w-4" />
                {currentLayout.name}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {config.layouts.map(layout => (
                <DropdownMenuItem
                  key={layout.id}
                  onClick={() => onLayoutChange?.(layout.id)}
                  className="gap-2"
                >
                  <Layout className="h-4 w-4" />
                  {layout.name}
                  {layout.isDefault && (
                    <Badge variant="secondary" className="ml-auto text-xs">Default</Badge>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowLayoutDialog(true)}>
                <Save className="mr-2 h-4 w-4" />
                Save Current Layout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Actions */}
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDataRefresh()}
              disabled={isRefreshing}
              className="gap-2 font-expanded"
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
              Refresh
            </Button>
            
            {!readonly && <WidgetLibrary onWidgetAdd={handleWidgetAdd} />}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditingSettings(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Dashboard Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Grid3X3 className="mr-2 h-4 w-4" />
                  {config.settings.showGrid ? 'Hide Grid' : 'Show Grid'}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Maximize className="mr-2 h-4 w-4" />
                  {config.settings.compactMode ? 'Normal Mode' : 'Compact Mode'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Export Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share className="mr-2 h-4 w-4" />
                  Share Dashboard
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      
      {/* Dashboard Grid */}
      <WidgetGrid
        widgets={currentLayout.widgets}
        widgetData={widgetData}
        onLayoutChange={handleLayoutChange}
        onWidgetUpdate={handleWidgetUpdate}
        onWidgetRemove={handleWidgetRemove}
        onWidgetRefresh={handleDataRefresh}
        readonly={readonly}
        loading={loading}
        showGrid={config.settings.showGrid}
        compactMode={config.settings.compactMode}
      />
      
      {/* Save Layout Dialog */}
      <Dialog open={showLayoutDialog} onOpenChange={setShowLayoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-expanded">Save Layout</DialogTitle>
            <DialogDescription className="font-semi-expanded">
              Save the current widget arrangement as a new layout.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="layout-name" className="font-expanded">Layout Name</Label>
              <Input
                id="layout-name"
                value={newLayoutName}
                onChange={(e) => setNewLayoutName(e.target.value)}
                placeholder="Enter layout name..."
                className="font-semi-expanded"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLayoutDialog(false)} className="font-expanded">
              Cancel
            </Button>
            <Button onClick={handleSaveLayout} disabled={!newLayoutName.trim()} className="font-expanded">
              Save Layout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Settings Dialog */}
      <Dialog open={editingSettings} onOpenChange={setEditingSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-expanded">Dashboard Settings</DialogTitle>
            <DialogDescription className="font-semi-expanded">
              Configure dashboard appearance and behavior.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="font-expanded">Auto Refresh</Label>
                <p className="text-sm text-muted-foreground font-semi-expanded">
                  Automatically refresh dashboard data
                </p>
              </div>
              <Switch
                checked={localSettings.autoRefresh}
                onCheckedChange={(checked) => 
                  setLocalSettings(prev => ({ ...prev, autoRefresh: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="font-expanded">Show Grid</Label>
                <p className="text-sm text-muted-foreground font-semi-expanded">
                  Display grid lines for alignment
                </p>
              </div>
              <Switch
                checked={localSettings.showGrid}
                onCheckedChange={(checked) => 
                  setLocalSettings(prev => ({ ...prev, showGrid: checked }))
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="font-expanded">Compact Mode</Label>
                <p className="text-sm text-muted-foreground font-semi-expanded">
                  Use smaller spacing between widgets
                </p>
              </div>
              <Switch
                checked={localSettings.compactMode}
                onCheckedChange={(checked) => 
                  setLocalSettings(prev => ({ ...prev, compactMode: checked }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSettings(false)} className="font-expanded">
              Cancel
            </Button>
            <Button onClick={handleSettingsUpdate} className="font-expanded">
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}