import { ReactNode } from 'react';

export type ChartType = 'line' | 'bar' | 'area' | 'pie' | 'donut' | 'scatter' | 'radar';

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

export interface ChartData {
  labels?: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[] | ChartDataPoint[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
  pointRadius?: number;
  pointHoverRadius?: number;
}

export interface ChartConfig {
  type: ChartType;
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  aspectRatio?: number;
  plugins?: {
    legend?: {
      display?: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
      labels?: {
        usePointStyle?: boolean;
        padding?: number;
        font?: {
          size?: number;
          family?: string;
          weight?: string;
        };
      };
    };
    tooltip?: {
      enabled?: boolean;
      mode?: 'index' | 'dataset' | 'point' | 'nearest' | 'x' | 'y';
      intersect?: boolean;
      backgroundColor?: string;
      titleColor?: string;
      bodyColor?: string;
      borderColor?: string;
      borderWidth?: number;
      cornerRadius?: number;
      displayColors?: boolean;
      callbacks?: {
        label?: (context: any) => string;
        title?: (context: any[]) => string;
        beforeBody?: (tooltipItems: any[]) => string | string[];
        afterBody?: (tooltipItems: any[]) => string | string[];
      };
    };
    datalabels?: {
      display?: boolean;
      color?: string;
      font?: {
        size?: number;
        weight?: string;
      };
      formatter?: (value: any, context: any) => string;
    };
  };
  scales?: {
    x?: {
      display?: boolean;
      title?: {
        display?: boolean;
        text?: string;
      };
      grid?: {
        display?: boolean;
        color?: string;
      };
      ticks?: {
        color?: string;
        font?: {
          size?: number;
        };
      };
    };
    y?: {
      display?: boolean;
      title?: {
        display?: boolean;
        text?: string;
      };
      grid?: {
        display?: boolean;
        color?: string;
      };
      ticks?: {
        color?: string;
        font?: {
          size?: number;
        };
        callback?: (value: any) => string;
      };
      beginAtZero?: boolean;
    };
  };
  animation?: {
    duration?: number;
    easing?: string;
  };
  interaction?: {
    mode?: 'index' | 'dataset' | 'point' | 'nearest' | 'x' | 'y';
    intersect?: boolean;
  };
}

export interface ChartProps {
  data: ChartData | ChartDataPoint[];
  config?: Partial<ChartConfig>;
  width?: number;
  height?: number;
  className?: string;
  loading?: boolean;
  error?: string;
  emptyState?: ReactNode;
  onDataPointClick?: (dataPoint: any, index: number) => void;
  onLegendClick?: (legendItem: any, index: number) => void;
  exportable?: boolean;
  exportFormats?: ('png' | 'jpg' | 'pdf' | 'svg')[];
  onExport?: (format: string) => void;
  title?: string;
  subtitle?: string;
  showLegend?: boolean;
  showTooltip?: boolean;
  showGrid?: boolean;
  theme?: 'light' | 'dark' | 'professional';
  colors?: string[];
  gradients?: boolean;
  animations?: boolean;
  drillDown?: boolean;
  onDrillDown?: (data: any) => void;
  compareMode?: boolean;
  comparisonData?: ChartData;
  realTime?: boolean;
  updateInterval?: number;
  onDataUpdate?: () => Promise<ChartData | ChartDataPoint[]>;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    period?: string;
  };
  icon?: ReactNode;
  description?: string;
  trend?: ChartDataPoint[];
  loading?: boolean;
  error?: string;
  className?: string;
  onClick?: () => void;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  format?: 'number' | 'currency' | 'percentage' | 'bytes' | 'duration';
  precision?: number;
  suffix?: string;
  prefix?: string;
}

export interface ChartContainerProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  loading?: boolean;
  error?: string;
  emptyState?: ReactNode;
  actions?: ReactNode;
  className?: string;
  fullscreen?: boolean;
  onFullscreenToggle?: () => void;
  exportable?: boolean;
  onExport?: (format: string) => void;
  refreshable?: boolean;
  onRefresh?: () => void;
  lastUpdated?: Date;
}

export interface ChartTheme {
  colors: {
    primary: string[];
    secondary: string[];
    success: string[];
    warning: string[];
    danger: string[];
    info: string[];
    neutral: string[];
  };
  gradients: {
    primary: string[];
    secondary: string[];
    success: string[];
    warning: string[];
    danger: string[];
    info: string[];
  };
  fonts: {
    family: string;
    sizes: {
      xs: number;
      sm: number;
      md: number;
      lg: number;
      xl: number;
    };
    weights: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}