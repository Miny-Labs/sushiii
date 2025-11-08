'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChartContainerProps } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Maximize2, 
  Minimize2, 
  Download, 
  RefreshCw, 
  Loader2,
  AlertCircle,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ChartContainer({
  title,
  subtitle,
  children,
  loading = false,
  error,
  emptyState,
  actions,
  className,
  fullscreen = false,
  onFullscreenToggle,
  exportable = false,
  onExport,
  refreshable = false,
  onRefresh,
  lastUpdated,
}: ChartContainerProps) {
  const handleExport = (format: string) => {
    if (onExport) {
      onExport(format);
    }
  };

  return (
    <Card className={cn(
      'transition-all duration-200',
      fullscreen && 'fixed inset-0 z-50 rounded-none',
      className
    )}>
      {/* Header */}
      {(title || subtitle || actions || exportable || refreshable || onFullscreenToggle) && (
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="space-y-1">
            {title && (
              <CardTitle className="text-lg font-semibold font-expanded">
                {title}
              </CardTitle>
            )}
            {subtitle && (
              <p className="text-sm text-muted-foreground font-semi-expanded">
                {subtitle}
              </p>
            )}
            {lastUpdated && (
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs font-semi-expanded">
                  Updated {lastUpdated.toLocaleTimeString()}
                </Badge>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Custom actions */}
            {actions}

            {/* Refresh button */}
            {refreshable && onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={loading}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={cn(
                  'h-4 w-4',
                  loading && 'animate-spin'
                )} />
              </Button>
            )}

            {/* Export dropdown */}
            {exportable && onExport && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('png')}>
                    Export as PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('jpg')}>
                    Export as JPG
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('svg')}>
                    Export as SVG
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Fullscreen toggle */}
            {onFullscreenToggle && (
              <Button
                variant="outline"
                size="sm"
                onClick={onFullscreenToggle}
                className="h-8 w-8 p-0"
              >
                {fullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* More options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Configure
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  Share
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
      )}

      {/* Content */}
      <CardContent className={cn(
        'pt-0',
        fullscreen && 'h-full flex flex-col'
      )}>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="font-semi-expanded">Loading chart...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center space-y-2 text-destructive">
              <AlertCircle className="h-8 w-8" />
              <span className="font-semi-expanded text-center">{error}</span>
            </div>
          </div>
        ) : (
          <div className={cn(
            'w-full',
            fullscreen && 'flex-1'
          )}>
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}