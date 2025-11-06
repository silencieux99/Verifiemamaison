'use client';

import { useAuth } from '@/app/(context)/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import KpiCard from './(components)/KpiCard';
import OrderDetailsModal from './(components)/OrderDetailsModal';
import UserDetailsModal from './(components)/UserDetailsModal';
import RecentOrdersTable from './(components)/RecentOrdersTable';
import RealtimeChart from './(components)/RealtimeChart';
import QuickActions from './(components)/QuickActions';
import {
  CurrencyEuroIcon,
  UserGroupIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  EyeIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';

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
  const [activeVisitors, setActiveVisitors] = useState<any[]>([]);
  const [todayVisitors, setTodayVisitors] = useState(0);
  const [todayOrders, setTodayOrders] = useState({
    paid: 0,
    unpaid: 0,
    amount: 0,
  });
  const [pagesVisited, setPagesVisited] = useState<{ [key: string]: number }>({});
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedUserLastOrder, setSelectedUserLastOrder] = useState<any>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [period, setPeriod] = useState<'today' | '24h' | '7d' | '30d'>('today');
  const [refreshing, setRefreshing] = useState(false);
  const [chartData, setChartData] = useState<{
    salesData: Array<{ timestamp: number; value: number; label?: string }>;
    visitsData: Array<{ timestamp: number; value: number; label?: string }>;
  }>({
    salesData: [],
    visitsData: [],
  });

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

  // Écouter les visiteurs en temps réel (2 dernières minutes)
  useEffect(() => {
    if (!firebaseUser || !user?.admin) return;

    const now = new Date();
    // Réduire à 2 minutes pour un tracking plus précis
    const startDate = new Date(now.getTime() - 2 * 60 * 1000);
    const startTimestamp = Timestamp.fromDate(startDate);

    const sessionsQuery = query(
      collection(db, 'active_sessions'),
      where('isActive', '==', true),
      where('lastSeen', '>=', startTimestamp),
      orderBy('lastSeen', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      sessionsQuery,
      (snapshot) => {
        // Filtrer aussi côté client pour être sûr (sessions vraiment actives)
        const now = Date.now();
        const twoMinutesAgo = now - 2 * 60 * 1000;
        
        const visitors = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            const lastSeen = data.lastSeen?.toMillis?.() || 0;
            return {
              id: doc.id,
              ...data,
              lastSeenMillis: lastSeen,
            };
          })
          .filter((v: any) => {
            // Filtrer les sessions vraiment actives (moins de 2 minutes)
            // ET exclure les sessions sur les pages admin
            const path = v.path || v.lastPath || '/';
            const isAdminPath = path.startsWith('/admin');
            return v.isActive && v.lastSeenMillis >= twoMinutesAgo && !isAdminPath;
          })
          .sort((a: any, b: any) => b.lastSeenMillis - a.lastSeenMillis);

        setActiveVisitors(visitors);
        
        // Compter les pages visitées
        const pages: { [key: string]: number } = {};
        visitors.forEach((v: any) => {
          const path = v.path || v.lastPath || '/';
          pages[path] = (pages[path] || 0) + 1;
        });
        setPagesVisited(pages);
      },
      (error) => {
        console.error('Erreur écoute visiteurs:', error);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser, user]);

  // Fonction pour obtenir minuit heure française (Europe/Paris)
  const getFrenchMidnight = () => {
    const now = new Date();
    
    // Obtenir la date actuelle en heure française (format: YYYY-MM-DD)
    const frenchDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
    const [year, month, day] = frenchDateStr.split('-').map(Number);
    
    // Créer une date à minuit en heure française
    // On utilise Intl.DateTimeFormat pour obtenir les composants de date en heure française
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Paris',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    // Obtenir la date formatée
    const parts = formatter.formatToParts(now);
    const frenchYear = parseInt(parts.find(p => p.type === 'year')?.value || String(year));
    const frenchMonth = parseInt(parts.find(p => p.type === 'month')?.value || String(month));
    const frenchDay = parseInt(parts.find(p => p.type === 'day')?.value || String(day));
    
    // Créer une date à minuit UTC pour cette date française
    // Puis calculer l'offset pour convertir en heure locale
    const frenchMidnightUTC = new Date(Date.UTC(frenchYear, frenchMonth - 1, frenchDay, 0, 0, 0, 0));
    
    // Calculer l'offset entre l'heure française et l'heure locale
    const frenchNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const localNow = new Date(now.toLocaleString('en-US'));
    const offset = frenchNow.getTime() - localNow.getTime();
    
    // Ajuster la date de minuit avec l'offset calculé
    return new Date(frenchMidnightUTC.getTime() - offset);
  };

  // Charger les statistiques du jour
  useEffect(() => {
    if (!firebaseUser || !user?.admin) return;

    const loadTodayStats = async () => {
      try {
        const token = await firebaseUser.getIdToken();
        
        // Déterminer la date de début selon la période
        let startDate: Date;
        if (period === 'today') {
          // Minuit heure française
          startDate = getFrenchMidnight();
        } else if (period === '24h') {
          startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        } else if (period === '7d') {
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        } else if (period === '30d') {
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        } else {
          startDate = getFrenchMidnight();
        }
        
        const startTimestamp = Timestamp.fromDate(startDate);
        
        // Utiliser la collection 'active_sessions' avec firstSeen pour compter toutes les sessions
        // qui ont commencé depuis minuit (plus efficace que de parcourir tous les événements 'visits')
        const activeSessionsQuery = query(
          collection(db, 'active_sessions'),
          where('firstSeen', '>=', startTimestamp)
        );

        const visitorsUnsub = onSnapshot(
          activeSessionsQuery,
          (snapshot) => {
            // Compter toutes les sessions uniques qui ont commencé depuis minuit
            // Exclure les sessions sur les pages admin
            const validSessions = snapshot.docs.filter((doc) => {
              const data = doc.data();
              const path = data.path || data.lastPath || '/';
              return !path.startsWith('/admin');
            });
            setTodayVisitors(validSessions.length);
          },
          (error) => {
            console.error('Erreur écoute sessions actives:', error);
            // Fallback : utiliser la collection 'visits' si active_sessions échoue
            const visitsQuery = query(
              collection(db, 'visits'),
              where('timestamp', '>=', startTimestamp)
            );
            
            const fallbackUnsub = onSnapshot(visitsQuery, (fallbackSnapshot) => {
              const uniqueSessions = new Set<string>();
              fallbackSnapshot.docs.forEach((doc) => {
                const data = doc.data();
                // Exclure les visites sur les pages admin
                const path = data.path || '/';
                if (data.sessionId && !path.startsWith('/admin')) {
                  uniqueSessions.add(data.sessionId);
                }
              });
              setTodayVisitors(uniqueSessions.size);
            });
            
            return () => fallbackUnsub();
          }
        );

        // Commandes selon la période
        const ordersResponse = await fetch('/api/admin/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (ordersResponse.ok) {
          const { orders } = await ordersResponse.json();
          
          const filteredOrders = orders.filter((order: any) => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= startDate;
          });

          const paidOrders = filteredOrders.filter((o: any) => 
            o.status === 'paid' || o.status === 'COMPLETE'
          );
          const unpaidOrders = filteredOrders.filter((o: any) => 
            o.status === 'pending' || o.status === 'PROCESSING' || o.status === 'GENERATING_REPORT'
          );
          
          const totalAmount = paidOrders.reduce((sum: number, o: any) => 
            sum + (o.amount || 0), 0
          );

          setTodayOrders({
            paid: paidOrders.length,
            unpaid: unpaidOrders.length,
            amount: totalAmount / 100,
          });

          setRecentOrders(orders.slice(0, 20));

          // Générer les données de graphique selon la période
          const salesData = filteredOrders
            .filter((o: any) => o.status === 'paid' || o.status === 'COMPLETE')
            .slice(0, 30)
            .map((o: any, index: number) => ({
              timestamp: o.createdAt || Date.now() - (30 - index) * 3600000,
              value: (o.amount || 0) / 100,
              label: new Date(o.createdAt || Date.now()).toLocaleDateString('fr-FR'),
            }));

          setChartData({
            salesData,
            visitsData: [], // À implémenter avec les données de visites
          });
        }

        return () => {
          visitorsUnsub();
        };
      } catch (error) {
        console.error('Erreur chargement stats:', error);
      }
    };

    loadTodayStats();
  }, [firebaseUser, user, period]);

  const handleViewOrder = async (order: any) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleViewUser = async (order: any) => {
    if (!order.customerUid || !firebaseUser) return;

    try {
      const token = await firebaseUser.getIdToken();
      
      const userResponse = await fetch(`/api/admin/users/${order.customerUid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        setSelectedUser(userData);
        
        const ordersResponse = await fetch('/api/admin/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (ordersResponse.ok) {
          const { orders } = await ordersResponse.json();
          const userOrders = orders.filter((o: any) => o.customerUid === order.customerUid);
          setSelectedUserLastOrder(userOrders[0] || null);
        }
        
        setIsUserModalOpen(true);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
    }
  };

  const refreshStats = async () => {
    if (!firebaseUser || refreshing) return;
    setRefreshing(true);
    try {
      const token = await firebaseUser.getIdToken();
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erreur refresh stats:', error);
    } finally {
      setRefreshing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Vue d'ensemble de votre plateforme VerifieMaMaison
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="h-9 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-sm focus:border-purple-500 focus:ring-purple-500"
          >
            <option value="today">Aujourd'hui</option>
            <option value="24h">24h</option>
            <option value="7d">7 jours</option>
            <option value="30d">30 jours</option>
          </select>
          
          <button
            onClick={refreshStats}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
          >
            <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
          
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${!loading ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {!loading ? 'Temps réel actif' : 'Chargement...'}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KpiCard
          title="Visiteurs en direct"
          value={activeVisitors.length}
          subtitle="Actuellement connectés"
          icon={<GlobeAltIcon className="w-6 h-6" />}
          color="purple"
          loading={loading}
          isRealtime={true}
        />
        <KpiCard
          title="Visiteurs aujourd'hui"
          value={todayVisitors}
          subtitle={`${stats.totalUsers} utilisateurs total`}
          icon={<UserGroupIcon className="w-6 h-6" />}
          color="blue"
          loading={loading}
          isRealtime={true}
        />
        <KpiCard
          title="Commandes payées"
          value={todayOrders.paid}
          subtitle={`${todayOrders.unpaid} en attente`}
          icon={<CheckCircleIcon className="w-6 h-6" />}
          color="green"
          loading={loading}
        />
        <KpiCard
          title="Montant du jour"
          value={`${todayOrders.amount.toFixed(2)}€`}
          subtitle={`${stats.totalRevenue.toFixed(2)}€ total`}
          icon={<CurrencyEuroIcon className="w-6 h-6" />}
          color="green"
          loading={loading}
        />
        <KpiCard
          title="Rapports générés"
          value={stats.totalReports}
          subtitle={`${stats.completedReports} complétés`}
          icon={<DocumentTextIcon className="w-6 h-6" />}
          color="indigo"
          loading={loading}
        />
      </div>

      {/* Pages visitées en temps réel */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <GlobeAltIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Pages visitées en temps réel
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  Actualisation automatique
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">En direct</span>
            </div>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          {Object.keys(pagesVisited).length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              Aucune page visitée
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {Object.entries(pagesVisited)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .map(([path, count]) => (
                  <div
                    key={path}
                    className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 flex-shrink-0"></div>
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white truncate">
                        {path || '/'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs sm:text-sm font-semibold text-purple-600 dark:text-purple-400">
                        {count as number}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        visiteur{(count as number) > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <RealtimeChart
          data={chartData.salesData}
          title="Évolution des ventes"
          type="area"
          color="#10B981"
          height={300}
          loading={loading}
        />
        
        <RealtimeChart
          data={chartData.visitsData.length > 0 ? chartData.visitsData : chartData.salesData}
          title="Trafic du site"
          type="line"
          color="#3B82F6"
          height={300}
          loading={loading}
        />
      </div>

      {/* Content Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RecentOrdersTable
            limit={20}
            onViewOrder={handleViewOrder}
            onViewUser={handleViewUser}
            showActions={true}
          />
        </div>
        
        <QuickActions 
          onExportData={async () => {
            // TODO: Implémenter l'export
            alert('Export à implémenter');
          }}
        />
      </div>

      {/* Modales */}
      <OrderDetailsModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        order={selectedOrder}
      />
      <UserDetailsModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        user={selectedUser}
        lastOrder={selectedUserLastOrder}
        firebaseUser={firebaseUser}
      />
    </div>
  );
}
