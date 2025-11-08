import React from 'react';
import { render, screen } from '@testing-library/react';
import { Chart } from '../Chart';
import { ChartDataPoint } from '../types';

// Mock Recharts components
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Pie: () => <div data-testid="pie" />,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Cell: () => <div data-testid="cell" />,
}));

const mockData: ChartDataPoint[] = [
  { name: 'Jan', value: 100 },
  { name: 'Feb', value: 200 },
  { name: 'Mar', value: 150 },
  { name: 'Apr', value: 300 },
];

describe('Chart', () => {
  it('renders loading state', () => {
    render(<Chart data={[]} loading={true} />);
    
    expect(screen.getByText('Loading chart...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(<Chart data={[]} error="Failed to load data" />);
    
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(<Chart data={[]} />);
    
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('renders bar chart by default', () => {
    render(<Chart data={mockData} />);
    
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('renders line chart when specified', () => {
    render(<Chart data={mockData} config={{ type: 'line' }} />);
    
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders pie chart when specified', () => {
    render(<Chart data={mockData} config={{ type: 'pie' }} />);
    
    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
  });

  it('renders area chart when specified', () => {
    render(<Chart data={mockData} config={{ type: 'area' }} />);
    
    expect(screen.getByTestId('area-chart')).toBeInTheDocument();
  });

  it('renders with title and subtitle', () => {
    render(
      <Chart 
        data={mockData} 
        title="Test Chart" 
        subtitle="Chart subtitle" 
      />
    );
    
    expect(screen.getByText('Test Chart')).toBeInTheDocument();
    expect(screen.getByText('Chart subtitle')).toBeInTheDocument();
  });

  it('shows real-time indicator when enabled', () => {
    render(<Chart data={mockData} realTime={true} />);
    
    expect(screen.getByText('Live')).toBeInTheDocument();
  });
});