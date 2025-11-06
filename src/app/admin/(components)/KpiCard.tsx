'use client';

import { ReactNode, useMemo } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray' | 'indigo' | 'pink';
  loading?: boolean;
  className?: string;
  onClick?: () => void;
  isRealtime?: boolean;
}

export default function KpiCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
  loading = false,
  className = '',
  onClick,
  isRealtime = false
}: KpiCardProps) {
  const colorClasses = useMemo(() => {
    const colors = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        icon: 'text-blue-600 dark:text-blue-400',
        value: 'text-blue-900 dark:text-blue-100',
        border: 'border-blue-200 dark:border-blue-800'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        icon: 'text-green-600 dark:text-green-400',
        value: 'text-green-900 dark:text-green-100',
        border: 'border-green-200 dark:border-green-800'
      },
      yellow: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        icon: 'text-yellow-600 dark:text-yellow-400',
        value: 'text-yellow-900 dark:text-yellow-100',
        border: 'border-yellow-200 dark:border-yellow-800'
      },
      red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        icon: 'text-red-600 dark:text-red-400',
        value: 'text-red-900 dark:text-red-100',
        border: 'border-red-200 dark:border-red-800'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        icon: 'text-purple-600 dark:text-purple-400',
        value: 'text-purple-900 dark:text-purple-100',
        border: 'border-purple-200 dark:border-purple-800'
      },
      gray: {
        bg: 'bg-gray-50 dark:bg-gray-800',
        icon: 'text-gray-600 dark:text-gray-400',
        value: 'text-gray-900 dark:text-gray-100',
        border: 'border-gray-200 dark:border-gray-700'
      },
      indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        icon: 'text-indigo-600 dark:text-indigo-400',
        value: 'text-indigo-900 dark:text-indigo-100',
        border: 'border-indigo-200 dark:border-indigo-800'
      },
      pink: {
        bg: 'bg-pink-50 dark:bg-pink-900/20',
        icon: 'text-pink-600 dark:text-pink-400',
        value: 'text-pink-900 dark:text-pink-100',
        border: 'border-pink-200 dark:border-pink-800'
      }
    };
    return colors[color];
  }, [color]);

  const formattedValue = useMemo(() => {
    if (loading) return '•••';
    if (typeof value === 'number' && value >= 1000) {
      if (value >= 1000000) {
        return (value / 1000000).toFixed(1) + 'M';
      }
      if (value >= 1000) {
        return (value / 1000).toFixed(1) + 'k';
      }
    }
    return value.toString();
  }, [value, loading]);

  return (
    <div 
      className={`
        relative overflow-hidden rounded-xl border bg-white dark:bg-gray-800 p-6 
        shadow-sm transition-all duration-200 hover:shadow-md 
        ${colorClasses.border} ${onClick ? 'cursor-pointer hover:scale-105' : ''} ${className}
      `}
      onClick={onClick}
    >
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 ${colorClasses.bg}`} />
      
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
              {title}
            </p>
            {isRealtime && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                LIVE
              </span>
            )}
          </div>
          
          <div className="mt-2 flex items-baseline gap-2">
            <p className={`text-2xl font-bold tracking-tight ${colorClasses.value}`}>
              {formattedValue}
            </p>
            
            {trend && !loading && (
              <div className={`flex items-center text-sm font-medium ${
                trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {trend.isPositive ? (
                  <ArrowUpIcon className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownIcon className="w-4 h-4 mr-1" />
                )}
                {Math.abs(trend.value)}%
              </div>
            )}
          </div>
          
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
          
          {trend && !loading && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {trend.period}
            </p>
          )}
        </div>
        
        {icon && (
          <div className={`flex-shrink-0 ${colorClasses.icon}`}>
            <div className="w-6 h-6">
              {icon}
            </div>
          </div>
        )}
      </div>
      
      {loading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-60" />
        </div>
      )}
    </div>
  );
}

