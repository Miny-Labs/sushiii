'use client';

import React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChartProps } from './types';

interface AreaChartProps extends Omit<ChartProps, 'config'> {
  config?: any;
  stacked?: boolean;
}

export function AreaChart({
  data,
  config = {},
  onDataPointClick,
  colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'],
  theme = 'professional',
  className,
  stacked = false,
}: AreaChartProps) {
  // Convert data to Recharts format
  const chartData = Array.isArray(data) ? data : data.datasets?.[0]?.data || [];
  
  // Get data keys for multiple areas
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
      <RechartsAreaChart
        data={chartData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 20,
        }}
        onClick={handleClick}
      >
        <defs>
          {colors.map((color, index) => (
            <linearGradient key={index} id={`colorGradient${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
            </linearGradient>
          ))}
        </defs>
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
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stackId={stacked ? "1" : undefined}
            stroke={colors[index % colors.length]}
            fill={`url(#colorGradient${index % colors.length})`}
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 2 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            connectNulls={false}
          />
        ))}
        
        {/* Single area for simple data */}
        {dataKeys.length === 0 && (
          <Area
            type="monotone"
            dataKey="value"
            stroke={colors[0]}
            fill={`url(#colorGradient0)`}
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 2 }}
            activeDot={{ r: 5, strokeWidth: 0 }}
            connectNulls={false}
          />
        )}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}