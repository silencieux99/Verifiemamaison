'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { EyeIcon, UserIcon } from '@heroicons/react/24/outline';

interface Order {
  id: string;
  customerEmail?: string;
  customerUid?: string;
  amount?: number;
  status?: string;
  createdAt?: number;
  [key: string]: any;
}

interface RecentOrdersTableProps {
  limit?: number;
  className?: string;
  onViewOrder?: (order: Order) => void;
  onViewUser?: (order: Order) => void;
  showActions?: boolean;
}

export default function RecentOrdersTable({ 
  limit: orderLimit = 20, 
  className = '', 
  onViewOrder,
  onViewUser,
  showActions = false 
}: RecentOrdersTableProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const validLimit = Math.max(1, orderLimit || 20);

  useEffect(() => {
    const ordersQuery = query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc'),
      limit(validLimit)
    );

    const unsubscribe = onSnapshot(
      ordersQuery,
      (snapshot) => {
        const ordersData: Order[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          ordersData.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toMillis?.() || data.createdAt,
          } as Order);
        });
        setOrders(ordersData);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching orders:', err);
        setError('Erreur lors du chargement des commandes');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [validLimit]);

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Chargement des commandes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
          {orderLimit} dernières commandes
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
              Aucune commande
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                        <p className="text-xs sm:text-sm font-mono text-gray-900 dark:text-white">
                          {order.id?.substring(0, 8) || 'N/A'}
                        </p>
                        <span className="text-gray-400">•</span>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                          {order.customerEmail || 'N/A'}
                        </p>
                        <span className="text-gray-400">•</span>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                          {order.amount ? `${(order.amount / 100).toFixed(2)}€` : 'N/A'}
                        </p>
                        <span className={`text-xs px-2 py-0.5 sm:py-1 rounded-full ${
                          order.status === 'paid' || order.status === 'COMPLETE'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {order.status || 'pending'}
                        </span>
                      </div>
                      {order.createdAt && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {format(new Date(order.createdAt), 'PPpp', { locale: fr })}
                        </p>
                      )}
                    </div>
                    {showActions && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {onViewOrder && (
                          <button
                            onClick={() => onViewOrder(order)}
                            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          >
                            <EyeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Voir</span>
                          </button>
                        )}
                        {onViewUser && order.customerUid && (
                          <button
                            onClick={() => onViewUser(order)}
                            className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                          >
                            <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Client</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


