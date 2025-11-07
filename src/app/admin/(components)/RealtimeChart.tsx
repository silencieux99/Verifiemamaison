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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
        <div className="bg-white dark:bg-gray-800 p-2 sm:p-3 rounded-md sm:rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
            {payload[0].payload.name}
          </p>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Valeur: <span className="font-semibold" style={{ color }}>{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6 ${className}`}>
        <div className="flex items-center justify-center" style={{ height: Math.min(height, 200) }}>
          <div className="text-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 sm:border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6 ${className}`}>
      <div className="flex items-center justify-between mb-3 sm:mb-4 lg:mb-6">
        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-white truncate">{title}</h3>
        {isRefreshing && (
          <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs lg:text-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="hidden sm:inline">Actualisation...</span>
          </div>
        )}
      </div>
      
      <div className="w-full" style={{ height: `${isMobile ? Math.min(height, 200) : height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
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
              fontSize={isMobile ? 10 : 12}
              tickLine={false}
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              height={isMobile ? 50 : 30}
            />
            <YAxis 
              stroke="#9ca3af"
              fontSize={isMobile ? 10 : 12}
              tickLine={false}
              width={isMobile ? 40 : 50}
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
              fontSize={isMobile ? 10 : 12}
              tickLine={false}
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              height={isMobile ? 50 : 30}
            />
            <YAxis 
              stroke="#9ca3af"
              fontSize={isMobile ? 10 : 12}
              tickLine={false}
              width={isMobile ? 40 : 50}
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
              fontSize={isMobile ? 10 : 12}
              tickLine={false}
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              height={isMobile ? 50 : 30}
            />
            <YAxis 
              stroke="#9ca3af"
              fontSize={isMobile ? 10 : 12}
              tickLine={false}
              width={isMobile ? 40 : 50}
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
    </div>
  );
}


