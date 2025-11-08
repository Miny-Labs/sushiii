'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ComplianceKPICardProps } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Target,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

export function ComplianceKPICard({ kpi, onClick, className }: ComplianceKPICardProps) {
  const formatValue = (value: string | number, format?: string, unit?: string) => {
    if (typeof value === 'string') return value;
    
    switch (format) {
      case 'percentage':
        return `${value}%`;
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(value);
      case 'duration':
        return `${value}${unit || 'h'}`;
      default:
        return `${value}${unit || ''}`;
    }
  };

  const getTrendIcon = () => {
    switch (kpi.change.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (kpi.status) {
      case 'excellent':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'good':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (kpi.status) {
      case 'excellent':
        return <CheckCircle className="h-4 w-4" />;
      case 'good':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <Clock className="h-4 w-4" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    if (kpi.change.trend === 'up') {
      return kpi.status === 'critical' || kpi.status === 'warning' 
        ? 'text-red-600' 
        : 'text-green-600';
    }
    if (kpi.change.trend === 'down') {
      return kpi.status === 'excellent' || kpi.status === 'good'
        ? 'text-red-600'
        : 'text-green-600';
    }
    return 'text-gray-600';
  };

  return (
    <Card 
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md',
        getStatusColor(),
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {kpi.title}
        </CardTitle>
        <div className="flex items-center space-x-1">
          {kpi.icon && <span className="text-primary">{kpi.icon}</span>}
          {getStatusIcon()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Main Value */}
          <div className="flex items-baseline space-x-2">
            <div className="text-2xl font-bold">
              {formatValue(kpi.value, kpi.format, kpi.unit)}
            </div>
            {kpi.target && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Target className="h-3 w-3 mr-1" />
                {formatValue(kpi.target, kpi.format, kpi.unit)}
              </div>
            )}
          </div>
          
          {/* Change Indicator */}
          <div className="flex items-center justify-between">
            <div className={cn(
              'flex items-center space-x-1 text-sm font-medium',
              getTrendColor()
            )}>
              {getTrendIcon()}
              <span>
                {kpi.change.value > 0 ? '+' : ''}{kpi.change.value}%
              </span>
              <span className="text-muted-foreground">
                vs {kpi.change.period}
              </span>
            </div>
            
            <Badge 
              variant="outline" 
              className={cn(
                'text-xs',
                kpi.status === 'excellent' && 'border-green-200 text-green-700',
                kpi.status === 'good' && 'border-blue-200 text-blue-700',
                kpi.status === 'warning' && 'border-yellow-200 text-yellow-700',
                kpi.status === 'critical' && 'border-red-200 text-red-700'
              )}
            >
              {kpi.status.charAt(0).toUpperCase() + kpi.status.slice(1)}
            </Badge>
          </div>
          
          {/* Description */}
          {kpi.description && (
            <p className="text-xs text-muted-foreground">
              {kpi.description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}