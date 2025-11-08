'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ComplianceMetricsProps } from './types';
import { ComplianceKPICard } from './ComplianceKPICard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  Download, 
  RefreshCw, 
  TrendingUp, 
  AlertCircle,
  BarChart3,
  Target,
  Calendar,
  CheckCircle
} from 'lucide-react';
import { Chart } from '../ChartLibrary/Chart';

export function ComplianceMetrics({
  kpis,
  trends,
  scores,
  benchmarks,
  alerts,
  timeRange,
  onTimeRangeChange,
  onKPIClick,
  onAlertAction,
  onExport,
  loading = false,
  className,
}: ComplianceMetricsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Filter alerts by severity
  const criticalAlerts = alerts.filter(alert => alert.severity === 'high' && alert.status === 'active');
  const totalAlerts = alerts.filter(alert => alert.status === 'active').length;

  // Calculate overall compliance score
  const overallScore = useMemo(() => {
    if (scores.length === 0) return 0;
    const weightedSum = scores.reduce((sum, score) => sum + (score.score / score.maxScore) * score.weight, 0);
    const totalWeight = scores.reduce((sum, score) => sum + score.weight, 0);
    return Math.round((weightedSum / totalWeight) * 100);
  }, [scores]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreStatus = (score: number) => {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'warning';
    return 'critical';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Compliance Metrics</h2>
          <p className="text-muted-foreground">
            Real-time compliance monitoring and analytics
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-32">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          
          <Button variant="outline" size="sm" className="gap-2" onClick={() => onExport?.('pdf')}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Overall Score Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Overall Compliance Score</h3>
              <div className="flex items-baseline space-x-2">
                <span className={cn('text-4xl font-bold', getScoreColor(overallScore))}>
                  {overallScore}%
                </span>
                <Badge 
                  variant="outline" 
                  className={cn(
                    getScoreStatus(overallScore) === 'excellent' && 'border-green-200 text-green-700',
                    getScoreStatus(overallScore) === 'good' && 'border-blue-200 text-blue-700',
                    getScoreStatus(overallScore) === 'warning' && 'border-yellow-200 text-yellow-700',
                    getScoreStatus(overallScore) === 'critical' && 'border-red-200 text-red-700'
                  )}
                >
                  {getScoreStatus(overallScore).charAt(0).toUpperCase() + getScoreStatus(overallScore).slice(1)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Based on {scores.length} compliance categories
              </p>
            </div>
            
            <div className="text-right space-y-2">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">
                  {criticalAlerts.length} Critical Alert{criticalAlerts.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">
                  {totalAlerts} Total Active Alert{totalAlerts !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <ComplianceKPICard
            key={kpi.id}
            kpi={kpi}
            onClick={() => onKPIClick?.(kpi)}
          />
        ))}
      </div>

      {/* Detailed Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="benchmarks" className="gap-2">
            <Target className="h-4 w-4" />
            Benchmarks
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Alerts ({totalAlerts})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compliance Scores by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Scores by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {scores.map(score => {
                    const percentage = Math.round((score.score / score.maxScore) * 100);
                    return (
                      <div key={score.category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{score.category}</span>
                          <span className={cn('text-sm font-semibold', getScoreColor(percentage))}>
                            {percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className={cn(
                              'h-2 rounded-full transition-all duration-300',
                              percentage >= 90 ? 'bg-green-500' :
                              percentage >= 75 ? 'bg-blue-500' :
                              percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center text-muted-foreground py-4">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                    <p>Activity tracking coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-4">
            {alerts.filter(alert => alert.status === 'active').length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Clear!</h3>
                  <p className="text-muted-foreground">
                    No active compliance alerts at this time.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}