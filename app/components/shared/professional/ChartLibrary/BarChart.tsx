'use client';

import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChartProps } from './types';

interface BarChartProps extends Omit<ChartProps, 'config'> {
  config?: any;
  orientation?: 'vertical' | 'horizontal';
}

export function BarChart({
  data,
  config = {},
  onDataPointClick,
  colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'],
  theme = 'professional',
  className,
  orientation = 'vertical',
}: BarChartProps) {
  // Convert data to Recharts format
  const chartData = Array.isArray(data) ? data : data.datasets?.[0]?.data || [];
  
  // Get data keys for multiple bars
  const dataKeys = chartData.length > 0 
    ? Object.keys(chartData[0] as any).filter(key => key !== 'name' && typeof (chartData[0] as any)[key] === 'number')
    : [];

  const handleClick = (data: any, index: number) => {
    if (onDataPointClick) {
      onDataPointClick(data, index);
    }
  };

  return (
    <ResponsiveContainer width="100%" height="100%" className={className}>
      <RechartsBarChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 20,
        }}
        onClick={handleClick}
        layout={orientation === 'horizontal' ? 'horizontal' : 'vertical'}
      >
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="rgba(0, 0, 0, 0.1)"
          vertical={orientation === 'vertical'}
          horizontal={orientation === 'horizontal'}
        />
        <XAxis 
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ 
            fontSize: 11, 
            fontFamily: 'Zalando Sans SemiExpanded, system-ui, sans-serif',
            fill: 'rgba(0, 0, 0, 0.6)'
          }}
          type={orientation === 'horizontal' ? 'number' : 'category'}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ 
            fontSize: 11, 
            fontFamily: 'Zalando Sans SemiExpanded, system-ui, sans-serif',
            fill: 'rgba(0, 0, 0, 0.6)'
          }}
          type={orientation === 'horizontal' ? 'category' : 'number'}
          dataKey={orientation === 'horizontal' ? 'name' : undefined}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#ffffff',
            fontFamily: 'Zalando Sans SemiExpanded, system-ui, sans-serif',
            fontSize: '12px',
          }}
          labelStyle={{ color: '#ffffff' }}
        />
        <Legend 
          wrapperStyle={{
            fontFamily: 'Zalando Sans SemiExpanded, system-ui, sans-serif',
            fontSize: '12px',
          }}
        />
        
        {dataKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={colors[index % colors.length]}
            radius={[2, 2, 0, 0]}
          />
        ))}
        
        {/* Single bar for simple data */}
        {dataKeys.length === 0 && (
          <Bar
            dataKey="value"
            fill={colors[0]}
            radius={[2, 2, 0, 0]}
          />
        )}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}