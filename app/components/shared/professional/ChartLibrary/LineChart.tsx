'use client';

import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChartProps } from './types';

interface LineChartProps extends Omit<ChartProps, 'config'> {
  config?: any;
}

export function LineChart({
  data,
  config = {},
  onDataPointClick,
  colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'],
  theme = 'professional',
  className,
}: LineChartProps) {
  // Convert data to Recharts format
  const chartData = Array.isArray(data) ? data : data.datasets?.[0]?.data || [];
  
  // Get data keys for multiple lines
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
      <RechartsLineChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 20,
        }}
        onClick={handleClick}
      >
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="rgba(0, 0, 0, 0.1)"
          vertical={false}
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
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ 
            fontSize: 11, 
            fontFamily: 'Zalando Sans SemiExpanded, system-ui, sans-serif',
            fill: 'rgba(0, 0, 0, 0.6)'
          }}
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
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[index % colors.length]}
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            connectNulls={false}
          />
        ))}
        
        {/* Single line for simple data */}
        {dataKeys.length === 0 && (
          <Line
            type="monotone"
            dataKey="value"
            stroke={colors[0]}
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2 }}
            activeDot={{ r: 6, strokeWidth: 0 }}
            connectNulls={false}
          />
        )}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}