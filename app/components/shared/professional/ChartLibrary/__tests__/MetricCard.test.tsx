import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MetricCard } from '../MetricCard';
import { TrendingUp } from 'lucide-react';

// Mock Recharts
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
}));

describe('MetricCard', () => {
  it('renders basic metric card', () => {
    render(
      <MetricCard
        title="Total Users"
        value={1234}
      />
    );
    
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('1,234')).toBeInTheDocument();
  });

  it('renders with change indicator', () => {
    render(
      <MetricCard
        title="Revenue"
        value={50000}
        format="currency"
        change={{
          value: 12.5,
          type: 'increase',
          period: 'last month'
        }}
      />
    );
    
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('$50,000')).toBeInTheDocument();
    expect(screen.getByText('+12.5%')).toBeInTheDocument();
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  it('renders with icon', () => {
    render(
      <MetricCard
        title="Growth Rate"
        value={15.5}
        format="percentage"
        icon={<TrendingUp data-testid="trend-icon" />}
      />
    );
    
    expect(screen.getByTestId('trend-icon')).toBeInTheDocument();
    expect(screen.getByText('15.5%')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(
      <MetricCard
        title="Loading Metric"
        value={0}
        loading={true}
      />
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(
      <MetricCard
        title="Error Metric"
        value={0}
        error="Failed to load data"
      />
    );
    
    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const mockOnClick = jest.fn();
    render(
      <MetricCard
        title="Clickable Metric"
        value={100}
        onClick={mockOnClick}
      />
    );
    
    const card = screen.getByText('Clickable Metric').closest('div[role="button"], div');
    if (card) {
      fireEvent.click(card);
      expect(mockOnClick).toHaveBeenCalled();
    }
  });

  it('formats currency values', () => {
    render(
      <MetricCard
        title="Revenue"
        value={1234.56}
        format="currency"
        precision={2}
      />
    );
    
    expect(screen.getByText('$1,234.56')).toBeInTheDocument();
  });

  it('formats percentage values', () => {
    render(
      <MetricCard
        title="Conversion Rate"
        value={12.345}
        format="percentage"
        precision={1}
      />
    );
    
    expect(screen.getByText('12.3%')).toBeInTheDocument();
  });

  it('renders with trend chart', () => {
    const trendData = [
      { name: 'Jan', value: 100 },
      { name: 'Feb', value: 120 },
      { name: 'Mar', value: 110 },
    ];

    render(
      <MetricCard
        title="Trending Metric"
        value={110}
        trend={trendData}
      />
    );
    
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    const { rerender } = render(
      <MetricCard
        title="Small Metric"
        value={100}
        size="sm"
      />
    );
    
    expect(screen.getByText('Small Metric')).toBeInTheDocument();
    
    rerender(
      <MetricCard
        title="Large Metric"
        value={100}
        size="lg"
      />
    );
    
    expect(screen.getByText('Large Metric')).toBeInTheDocument();
  });
});