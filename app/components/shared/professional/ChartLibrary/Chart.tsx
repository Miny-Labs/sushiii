'use client';

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ChartProps, ChartType } from './types';
import { LineChart } from './LineChart';
import { BarChart } from './BarChart';
import { PieChart } from './PieChart';
import { AreaChart } from './AreaChart';
import { ChartContainer } from './ChartContainer';
import { Loader2, AlertCircle, BarChart3 } from 'lucide-react';

export function Chart({
  data,
  config = {},
  width,
  height = 300,
  className,
  loading = false,
  error,
  emptyState,
  onDataPointClick,
  onLegendClick,
  exportable = false,
  exportFormats = ['png', 'jpg', 'pdf'],
  onExport,
  title,
  subtitle,
  showLegend = true,
  showTooltip = true,
  showGrid = true,
  theme = 'professional',
  colors,
  gradients = false,
  animations = true,
  drillDown = false,
  onDrillDown,
  compareMode = false,
  comparisonData,
  realTime = false,
  updateInterval = 30000,
  onDataUpdate,
}: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartData, setChartData] = useState(data);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Real-time data updates
  useEffect(() => {
    if (!realTime || !onDataUpdate) return;

    const interval = setInterval(async () => {
      try {
        const newData = await onDataUpdate();
        setChartData(newData);
      } catch (error) {
        console.error('Failed to update chart data:', error);
      }
    }, updateInterval);

    return () => clearInterval(interval);
  }, [realTime, onDataUpdate, updateInterval]);

  // Determine chart type from config or data structure
  const chartType: ChartType = useMemo(() => {
    if (config.type) return config.type;
    
    // Auto-detect chart type based on data structure
    if (Array.isArray(data)) {
      if (data.length > 0 && typeof data[0] === 'object' && 'name' in data[0] && 'value' in data[0]) {
        return 'bar'; // Simple data points default to bar chart
      }
    }
    
    return 'line'; // Default fallback
  }, [config.type, data]);

  // Prepare chart configuration with theme
  const chartConfig = useMemo(() => {
    const baseConfig = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: showLegend,
          position: 'top' as const,
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              family: 'Zalando Sans SemiExpanded, system-ui, sans-serif',
              size: 12,
              weight: '500',
            },
          },
        },
        tooltip: {
          enabled: showTooltip,
          mode: 'index' as const,
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
        },
      },
      scales: chartType !== 'pie' && chartType !== 'donut' ? {
        x: {
          display: true,
          grid: {
            display: showGrid,
            color: 'rgba(0, 0, 0, 0.1)',
          },
          ticks: {
            color: 'rgba(0, 0, 0, 0.6)',
            font: {
              family: 'Zalando Sans SemiExpanded, system-ui, sans-serif',
              size: 11,
            },
          },
        },
        y: {
          display: true,
          grid: {
            display: showGrid,
            color: 'rgba(0, 0, 0, 0.1)',
          },
          ticks: {
            color: 'rgba(0, 0, 0, 0.6)',
            font: {
              family: 'Zalando Sans SemiExpanded, system-ui, sans-serif',
              size: 11,
            },
          },
          beginAtZero: true,
        },
      } : undefined,
      animation: animations ? {
        duration: 750,
        easing: 'easeInOutQuart',
      } : false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      ...config,
    };

    return baseConfig;
  }, [config, showLegend, showTooltip, showGrid, chartType, animations]);

  // Handle export
  const handleExport = (format: string) => {
    if (onExport) {
      onExport(format);
    } else {
      // Default export implementation
      const canvas = chartRef.current?.querySelector('canvas');
      if (canvas) {
        const link = document.createElement('a');
        link.download = `chart.${format}`;
        link.href = canvas.toDataURL(`image/${format}`);
        link.click();
      }
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    if (onDataUpdate) {
      try {
        const newData = await onDataUpdate();
        setChartData(newData);
      } catch (error) {
        console.error('Failed to refresh chart data:', error);
      }
    }
  };

  // Render appropriate chart component
  const renderChart = () => {
    const commonProps = {
      data: chartData,
      config: chartConfig,
      width,
      height,
      onDataPointClick,
      onLegendClick,
      colors,
      gradients,
      theme,
      className: 'w-full h-full',
    };

    switch (chartType) {
      case 'line':
        return <LineChart {...commonProps} />;
      case 'bar':
        return <BarChart {...commonProps} />;
      case 'area':
        return <AreaChart {...commonProps} />;
      case 'pie':
      case 'donut':
        return <PieChart {...commonProps} variant={chartType} />;
      default:
        return <BarChart {...commonProps} />;
    }
  };

  if (loading) {
    return (
      <ChartContainer
        title={title}
        subtitle={subtitle}
        loading={loading}
        className={className}
      >
        <div className="flex items-center justify-center h-full min-h-[200px]">
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="font-semi-expanded">Loading chart...</span>
          </div>
        </div>
      </ChartContainer>
    );
  }

  if (error) {
    return (
      <ChartContainer
        title={title}
        subtitle={subtitle}
        error={error}
        className={className}
      >
        <div className="flex items-center justify-center h-full min-h-[200px]">
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="h-6 w-6" />
            <span className="font-semi-expanded">{error}</span>
          </div>
        </div>
      </ChartContainer>
    );
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <ChartContainer
        title={title}
        subtitle={subtitle}
        emptyState={emptyState}
        className={className}
      >
        {emptyState || (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground">
            <BarChart3 className="h-12 w-12 mb-4" />
            <span className="font-semi-expanded">No data available</span>
          </div>
        )}
      </ChartContainer>
    );
  }

  return (
    <ChartContainer
      title={title}
      subtitle={subtitle}
      className={className}
      fullscreen={isFullscreen}
      onFullscreenToggle={() => setIsFullscreen(!isFullscreen)}
      exportable={exportable}
      onExport={handleExport}
      refreshable={realTime}
      onRefresh={handleRefresh}
    >
      <div
        ref={chartRef}
        className={cn(
          'relative w-full',
          isFullscreen ? 'h-screen' : `h-[${height}px]`
        )}
        style={{ height: isFullscreen ? '100vh' : height }}
      >
        {renderChart()}
        
        {/* Comparison overlay */}
        {compareMode && comparisonData && (
          <div className="absolute top-0 right-0 p-2">
            <div className="text-xs text-muted-foreground font-semi-expanded">
              Comparison Mode
            </div>
          </div>
        )}
        
        {/* Real-time indicator */}
        {realTime && (
          <div className="absolute top-2 right-2">
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="font-semi-expanded">Live</span>
            </div>
          </div>
        )}
      </div>
    </ChartContainer>
  );
}