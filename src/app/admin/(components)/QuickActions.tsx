'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlusIcon,
  DocumentDuplicateIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  BellIcon,
} from '@heroicons/react/24/outline';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  action: () => void | Promise<void>;
  disabled?: boolean;
  badge?: string | number;
}

interface QuickActionsProps {
  onCreateOrder?: () => void;
  onBulkResend?: () => void;
  onExportData?: () => void;
  onSystemCheck?: () => void;
  onOpenNotifications?: () => void;
  className?: string;
}

export default function QuickActions({
  onCreateOrder,
  onBulkResend,
  onExportData,
  onSystemCheck,
  onOpenNotifications,
  className = ''
}: QuickActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const executeAction = async (actionId: string, action: () => void | Promise<void>) => {
    try {
      setLoading(actionId);
      await action();
    } catch (error) {
      console.error(`Error executing action ${actionId}:`, error);
    } finally {
      setLoading(null);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'view-reports',
      title: 'Rapports',
      description: 'Voir tous les rapports',
      icon: DocumentTextIcon,
      color: 'blue',
      action: () => router.push('/admin/reports')
    },
    {
      id: 'manage-users',
      title: 'Utilisateurs',
      description: 'Gérer les comptes',
      icon: UserGroupIcon,
      color: 'purple',
      action: () => router.push('/admin/users')
    },
    {
      id: 'view-orders',
      title: 'Commandes',
      description: 'Toutes les commandes',
      icon: ChartBarIcon,
      color: 'green',
      action: () => router.push('/admin/orders')
    },
    {
      id: 'export-data',
      title: 'Export',
      description: 'Télécharger CSV',
      icon: DocumentTextIcon,
      color: 'gray',
      action: () => onExportData?.()
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30',
        icon: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30',
        icon: 'text-green-600 dark:text-green-400',
        border: 'border-green-200 dark:border-green-800'
      },
      yellow: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30',
        icon: 'text-yellow-600 dark:text-yellow-400',
        border: 'border-yellow-200 dark:border-yellow-800'
      },
      red: {
        bg: 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30',
        icon: 'text-red-600 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30',
        icon: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800'
      },
      gray: {
        bg: 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700',
        icon: 'text-gray-600 dark:text-gray-400',
        border: 'border-gray-200 dark:border-gray-700'
      }
    };
    return colors[color as keyof typeof colors] || colors.gray;
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Actions rapides
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Raccourcis vers les tâches courantes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {quickActions.map((action) => {
          const colorClasses = getColorClasses(action.color);
          const Icon = action.icon;
          const isLoading = loading === action.id;
          
          return (
            <button
              key={action.id}
              onClick={() => executeAction(action.id, action.action)}
              disabled={action.disabled || isLoading}
              className={`
                relative p-4 rounded-lg border transition-all duration-200 text-left
                ${colorClasses.bg} ${colorClasses.border}
                ${action.disabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:shadow-md hover:scale-105 active:scale-95'
                }
                disabled:hover:shadow-none disabled:hover:scale-100
              `}
            >
              {action.badge && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                  {action.badge}
                </div>
              )}
              
              <div className={`${colorClasses.icon} mb-3`}>
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1">
                  {action.title}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {action.description}
                </p>
              </div>
              
              {isLoading && (
                <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-gray-600 dark:text-gray-400">
              Tous les services fonctionnent
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


