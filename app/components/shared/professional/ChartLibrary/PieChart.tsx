'use client';

import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChartProps } from './types';

interface PieChartProps extends Omit<ChartProps, 'config'> {
  config?: any;
  variant?: 'pie' | 'donut';
}

export function PieChart({
  data,
  config = {},
  onDataPointClick,
  colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#8dd1e1', '#d084d0'],
  theme = 'professional',
  className,
  variant = 'pie',
}: PieChartProps) {
  // Convert data to Recharts format
  const chartData = Array.isArray(data) ? data : data.datasets?.[0]?.data || [];

  const handleClick = (data: any, index: number) => {
    if (onDataPointClick) {
      onDataPointClick(data, index);
    }
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices smaller than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={11}
        fontFamily="Zalando Sans SemiExpanded, system-ui, sans-serif"
        fontWeight="500"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height="100%" className={className}>
      <RechartsPieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={variant === 'donut' ? 100 : 120}
          innerRadius={variant === 'donut' ? 60 : 0}
          fill="#8884d8"
          dataKey="value"
          onClick={handleClick}
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={colors[index % colors.length]}
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth={1}
            />
          ))}
        </Pie>
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
          formatter={(value: any, name: string) => [
            typeof value === 'number' ? value.toLocaleString() : value,
            name
          ]}
        />
        <Legend 
          wrapperStyle={{
            fontFamily: 'Zalando Sans SemiExpanded, system-ui, sans-serif',
            fontSize: '12px',
          }}
          iconType="circle"
        />
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}