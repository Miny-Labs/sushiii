'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { MetricCardProps } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Loader2,
  AlertCircle 
} from 'lucide-react';

export function MetricCard({
  title,
  value,
  change,
  icon,
  description,
  trend,
  loading = false,
  error,
  className,
  onClick,
  color,
  size = 'md',
  format = 'number',
  precision = 0,
  suffix,
  prefix,
}: MetricCardProps) {
  // Format the value based on the format type
  const formatValue = (val: string | number): string => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: precision,
          maximumFractionDigits: precision,
        }).format(val);
      case 'percentage':
        return `${val.toFixed(precision)}%`;
      case 'bytes':
        const units = ['B', 'KB', 'MB', 'GB', 'TB'];
        let size = val;
        let unitIndex = 0;
        while (size >= 1024 && unitIndex < units.length - 1) {
          size /= 1024;
          unitIndex++;
        }
        return `${size.toFixed(precision)} ${units[unitIndex]}`;
      case 'duration':
        const hours = Math.floor(val / 3600);
        const minutes = Math.floor((val % 3600) / 60);
        const seconds = val % 60;
        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
      case 'number':
      default:
        return val.toLocaleString(undefined, {
          minimumFractionDigits: precision,
          maximumFractionDigits: precision,
        });
    }
  };

  const getChangeIcon = () => {
    if (!change) return null;
    
    switch (change.type) {
      case 'increase':
        return <TrendingUp className="h-3 w-3" />;
      case 'decrease':
        return <TrendingDown className="h-3 w-3" />;
      case 'neutral':
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getChangeColor = () => {
    if (!change) return '';
    
    switch (change.type) {
      case 'increase':
        return 'text-green-600';
      case 'decrease':
        return 'text-red-600';
      case 'neutral':
      default:
        return 'text-muted-foreground';
    }
  };

  const cardSizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const titleSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const valueSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  if (loading) {
    return (
      <Card className={cn('transition-all duration-200', className)}>
        <CardContent className={cn('flex items-center justify-center', cardSizeClasses[size])}>
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-semi-expanded text-sm">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn('transition-all duration-200', className)}>
        <CardContent className={cn('flex items-center justify-center', cardSizeClasses[size])}>
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span className="font-semi-expanded text-sm">{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        'transition-all duration-200 hover:shadow-md',
        onClick && 'cursor-pointer hover:shadow-lg',
        className
      )}
      onClick={onClick}
      style={{ borderLeftColor: color, borderLeftWidth: color ? '4px' : undefined }}
    >
      <CardContent className={cardSizeClasses[size]}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Title */}
            <div className="flex items-center space-x-2 mb-2">
              {icon && <span className="text-muted-foreground">{icon}</span>}
              <h3 className={cn(
                'font-medium font-expanded text-muted-foreground',
                titleSizeClasses[size]
              )}>
                {title}
              </h3>
            </div>

            {/* Value */}
            <div className="flex items-baseline space-x-2 mb-2">
              {prefix && (
                <span className="text-sm text-muted-foreground font-semi-expanded">
                  {prefix}
                </span>
              )}
              <span className={cn(
                'font-bold font-expanded',
                valueSizeClasses[size]
              )}>
                {formatValue(value)}
              </span>
              {suffix && (
                <span className="text-sm text-muted-foreground font-semi-expanded">
                  {suffix}
                </span>
              )}
            </div>

            {/* Change indicator */}
            {change && (
              <div className="flex items-center space-x-1 mb-2">
                <Badge 
                  variant="outline" 
                  className={cn('gap-1', getChangeColor())}
                >
                  {getChangeIcon()}
                  <span className="font-semi-expanded">
                    {change.value > 0 ? '+' : ''}{change.value}%
                  </span>
                </Badge>
                {change.period && (
                  <span className="text-xs text-muted-foreground font-semi-expanded">
                    vs {change.period}
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            {description && (
              <p className="text-xs text-muted-foreground font-semi-expanded">
                {description}
              </p>
            )}
          </div>

          {/* Trend chart */}
          {trend && trend.length > 0 && (
            <div className="w-16 h-8 ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={color || '#8884d8'}
                    strokeWidth={2}
                    dot={false}
                    activeDot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}