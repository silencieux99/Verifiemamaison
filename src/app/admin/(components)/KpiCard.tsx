'use client';

import { ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
}

export default function KpiCard({ title, value, icon: Icon, trend, subtitle }: KpiCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Icon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                {value}
              </div>
              {subtitle && (
                <div className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  {subtitle}
                </div>
              )}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
}

