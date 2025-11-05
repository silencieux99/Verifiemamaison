'use client';

import { useAuth } from '@/app/(context)/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import KpiCard from './(components)/KpiCard';
import {
  CurrencyEuroIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { user, loading: authLoading, firebaseUser } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalReports: 0,
    totalRevenue: 0,
    totalUsers: 0,
    completedReports: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !user.admin) router.push('/admin/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!firebaseUser) return;
      try {
        setLoading(true);
        const token = await firebaseUser.getIdToken();
        const res = await fetch('/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Erreur stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [firebaseUser]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard VerifieMaMaison
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Vue d'ensemble de votre activité
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Revenus totaux"
          value={`${stats.totalRevenue.toFixed(2)}€`}
          icon={CurrencyEuroIcon}
          trend="up"
        />
        <KpiCard
          title="Rapports générés"
          value={stats.totalReports.toString()}
          icon={DocumentTextIcon}
          trend="up"
        />
        <KpiCard
          title="Utilisateurs"
          value={stats.totalUsers.toString()}
          icon={UserGroupIcon}
          trend="up"
        />
        <KpiCard
          title="Rapports complétés"
          value={stats.completedReports.toString()}
          icon={CheckCircleIcon}
          trend="up"
        />
      </div>

      <div className="mt-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Actions rapides
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <a
              href="/admin/reports"
              className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white">Voir les rapports</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Consulter tous les rapports générés
              </p>
            </a>
            <a
              href="/admin/users"
              className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white">Gérer les utilisateurs</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Voir et modifier les comptes utilisateurs
              </p>
            </a>
            <a
              href="/admin/orders"
              className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white">Commandes</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Consulter les commandes et paiements
              </p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

