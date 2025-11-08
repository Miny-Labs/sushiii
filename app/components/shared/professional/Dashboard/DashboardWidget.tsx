'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { WidgetProps, WidgetData } from './types';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  MoreVertical, 
  RefreshCw, 
  Settings, 
  Trash2, 
  Maximize2,
  Minimize2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { MetricCard } from '../ChartLibrary/MetricCard';
import { Chart } from '../ChartLibrary/Chart';
import { DataTable } from '../DataTable/DataTable';

export function DashboardWidget({
  config,
  data,
  onUpdate,
  onRemove,
  onRefresh,
  readonly = false,
  loading = false,
  className,
}: WidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, isRefreshing]);

  const handleRemove = useCallback(() => {
    setShowDeleteDialog(false);
    onRemove?.();
  }, [onRemove]);

  const renderWidgetContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    switch (config.type) {
      case 'metric-card':
        return (
          <MetricCard
            title={data?.title || 'Metric'}
            value={data?.value || '0'}
            change={data?.change}
            trend={data?.trend}
            icon={data?.icon || <Activity className="h-4 w-4" />}
            className="border-0 shadow-none"
          />
        );

      case 'chart':
        return (
          <Chart
            data={data?.chartData || []}
            config={{
              type: data?.chartType || 'line',
              ...data?.chartConfig
            }}
            className="h-full"
          />
        );

      case 'table':
        return (
          <DataTable
            data={data?.tableData || []}
            columns={data?.columns || []}
            className="border-0"
          />
        );

      case 'list':
        return (
          <div className="space-y-2">
            {(data?.items || []).map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-md hover:bg-accent">
                <div className="flex items-center space-x-2">
                  {item.icon && <span className="text-muted-foreground">{item.icon}</span>}
                  <span className="font-semi-expanded">{item.title}</span>
                </div>
                {item.value && (
                  <Badge variant="secondary" className="font-semi-expanded">
                    {item.value}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        );

      case 'progress':
        return (
          <div className="space-y-4">
            {(data?.progressItems || []).map((item: any, index: number) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium font-expanded">{item.label}</span>
                  <span className="text-sm text-muted-foreground font-semi-expanded">
                    {item.value}%
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        );

      case 'alert':
        return (
          <div className="space-y-3">
            {(data?.alerts || []).map((alert: any, index: number) => (
              <div key={index} className={cn(
                'flex items-start space-x-3 p-3 rounded-md border',
                alert.severity === 'high' && 'border-destructive bg-destructive/5',
                alert.severity === 'medium' && 'border-yellow-500 bg-yellow-500/5',
                alert.severity === 'low' && 'border-blue-500 bg-blue-500/5'
              )}>
                <AlertCircle className={cn(
                  'h-4 w-4 mt-0.5',
                  alert.severity === 'high' && 'text-destructive',
                  alert.severity === 'medium' && 'text-yellow-500',
                  alert.severity === 'low' && 'text-blue-500'
                )} />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium font-expanded">{alert.title}</p>
                  <p className="text-xs text-muted-foreground font-semi-expanded">
                    {alert.description}
                  </p>
                  <p className="text-xs text-muted-foreground font-semi-expanded">
                    {alert.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );

      case 'activity-feed':
        return (
          <div className="space-y-3">
            {(data?.activities || []).map((activity: any, index: number) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  {activity.icon || <Activity className="h-4 w-4 text-primary" />}
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium font-expanded">{activity.title}</p>
                  <p className="text-xs text-muted-foreground font-semi-expanded">
                    {activity.description}
                  </p>
                  <p className="text-xs text-muted-foreground font-semi-expanded">
                    {activity.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );

      case 'quick-actions':
        return (
          <div className="grid grid-cols-2 gap-2">
            {(data?.actions || []).map((action: any, index: number) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={action.onClick}
                className="h-auto p-3 flex flex-col items-center space-y-2 font-expanded"
              >
                {action.icon && <span className="text-primary">{action.icon}</span>}
                <span className="text-xs text-center">{action.label}</span>
              </Button>
            ))}
          </div>
        );

      case 'custom':
        if (data?.customComponent) {
          const CustomComponent = data.customComponent;
          return <CustomComponent {...data.customProps} />;
        }
        return (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p className="font-semi-expanded">Custom widget content</p>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p className="font-semi-expanded">Widget type not supported</p>
          </div>
        );
    }
  };

  const showHeader = config.config?.showHeader !== false;
  const allowResize = config.config?.allowResize !== false;
  const allowMove = config.config?.allowMove !== false;
  const allowRemove = config.config?.allowRemove !== false;

  return (
    <>
      <Card className={cn(
        'h-full flex flex-col transition-all duration-200',
        isExpanded && 'shadow-lg ring-2 ring-primary/20',
        className
      )}>
        {showHeader && (
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center space-x-2">
              {config.icon && (
                <span className="text-primary">{config.icon}</span>
              )}
              <CardTitle className="text-sm font-expanded">
                {config.title}
              </CardTitle>
            </div>
            
            {!readonly && (
              <div className="flex items-center space-x-1">
                {onRefresh && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="h-8 w-8 p-0"
                  >
                    <RefreshCw className={cn(
                      'h-3 w-3',
                      isRefreshing && 'animate-spin'
                    )} />
                  </Button>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsExpanded(!isExpanded)}>
                      {isExpanded ? (
                        <><Minimize2 className="mr-2 h-4 w-4" />Minimize</>
                      ) : (
                        <><Maximize2 className="mr-2 h-4 w-4" />Expand</>
                      )}
                    </DropdownMenuItem>
                    {onUpdate && (
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        Configure
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    {allowRemove && onRemove && (
                      <DropdownMenuItem 
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </CardHeader>
        )}
        
        <CardContent className="flex-1 p-4">
          {config.description && (
            <p className="text-xs text-muted-foreground mb-3 font-semi-expanded">
              {config.description}
            </p>
          )}
          {renderWidgetContent()}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-expanded">Remove Widget</AlertDialogTitle>
            <AlertDialogDescription className="font-semi-expanded">
              Are you sure you want to remove "{config.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-expanded">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-expanded"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}