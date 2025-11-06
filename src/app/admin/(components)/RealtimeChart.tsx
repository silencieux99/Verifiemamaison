'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

interface RealtimeChartProps {
  data: Array<{ timestamp: number; value: number; label?: string }>;
  title: string;
  type?: 'line' | 'area' | 'bar';
  color?: string;
  height?: number;
  showGrid?: boolean;
  showTooltip?: boolean;
  animate?: boolean;
  refreshInterval?: number;
  onRefresh?: () => Promise<void>;
  loading?: boolean;
  className?: string;
}

export default function RealtimeChart({
  data,
  title,
  type = 'line',
  color = '#3B82F6',
  height = 300,
  showGrid = true,
  showTooltip = true,
  animate = true,
  refreshInterval,
  onRefresh,
  loading = false,
  className = ''
}: RealtimeChartProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-refresh logic
  useEffect(() => {
    if (!refreshInterval || !onRefresh) return;

    const interval = setInterval(async () => {
      if (!isRefreshing && !loading) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } catch (error) {
          console.error('Chart refresh error:', error);
        } finally {
          setIsRefreshing(false);
        }
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, onRefresh, isRefreshing, loading]);

  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      name: item.label || new Date(item.timestamp).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {payload[0].payload.name}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Valeur: <span className="font-semibold" style={{ color }}>{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="text-center">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {isRefreshing && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            Actualisation...
          </div>
        )}
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        {type === 'area' ? (
          <AreaChart data={chartData}>
            {showGrid && <ReferenceLine y={0} stroke="#e5e7eb" />}
            <defs>
              <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="name" 
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
            />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${color})`}
              animationDuration={animate ? 1000 : 0}
            />
          </AreaChart>
        ) : type === 'bar' ? (
          <BarChart data={chartData}>
            {showGrid && <ReferenceLine y={0} stroke="#e5e7eb" />}
            <XAxis 
              dataKey="name" 
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
            />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            <Bar
              dataKey="value"
              fill={color}
              animationDuration={animate ? 1000 : 0}
            />
          </BarChart>
        ) : (
          <LineChart data={chartData}>
            {showGrid && <ReferenceLine y={0} stroke="#e5e7eb" />}
            <XAxis 
              dataKey="name" 
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#9ca3af"
              fontSize={12}
              tickLine={false}
            />
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, r: 4 }}
              animationDuration={animate ? 1000 : 0}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}


