import { ReactNode } from 'react';

export interface ComplianceKPI {
  id: string;
  title: string;
  value: string | number;
  target?: string | number;
  change: {
    value: number;
    period: string;
    trend: 'up' | 'down' | 'stable';
  };
  status: 'excellent' | 'good' | 'warning' | 'critical';
  description?: string;
  icon?: ReactNode;
  unit?: string;
  format?: 'number' | 'percentage' | 'currency' | 'duration';
}

export interface ComplianceTrend {
  date: string;
  value: number;
  target?: number;
  events?: {
    type: 'policy_update' | 'audit' | 'incident' | 'training';
    title: string;
    description?: string;
  }[];
}

export interface ComplianceScore {
  category: string;
  score: number;
  maxScore: number;
  weight: number;
  subcategories?: {
    name: string;
    score: number;
    maxScore: number;
    issues?: string[];
  }[];
  lastUpdated: Date;
  trend: 'improving' | 'declining' | 'stable';
}

export interface BenchmarkData {
  category: string;
  yourScore: number;
  industryAverage: number;
  topQuartile: number;
  bestInClass: number;
  sampleSize: number;
  lastUpdated: Date;
}

export interface ComplianceAlert {
  id: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  category: string;
  timestamp: Date;
  status: 'active' | 'acknowledged' | 'resolved';
  assignee?: string;
  dueDate?: Date;
  actions?: {
    label: string;
    action: () => void;
  }[];
}

export interface ComplianceMetricsProps {
  kpis: ComplianceKPI[];
  trends: ComplianceTrend[];
  scores: ComplianceScore[];
  benchmarks: BenchmarkData[];
  alerts: ComplianceAlert[];
  timeRange: '7d' | '30d' | '90d' | '1y';
  onTimeRangeChange: (range: '7d' | '30d' | '90d' | '1y') => void;
  onKPIClick?: (kpi: ComplianceKPI) => void;
  onAlertAction?: (alertId: string, action: string) => void;
  onExport?: (format: 'pdf' | 'excel' | 'csv') => void;
  loading?: boolean;
  className?: string;
}

export interface ComplianceKPICardProps {
  kpi: ComplianceKPI;
  onClick?: () => void;
  className?: string;
}

export interface ComplianceTrendChartProps {
  data: ComplianceTrend[];
  title: string;
  description?: string;
  showTarget?: boolean;
  showEvents?: boolean;
  height?: number;
  className?: string;
}

export interface ComplianceHeatmapProps {
  scores: ComplianceScore[];
  title: string;
  description?: string;
  className?: string;
}

export interface ComplianceBenchmarkProps {
  data: BenchmarkData[];
  title: string;
  description?: string;
  className?: string;
}