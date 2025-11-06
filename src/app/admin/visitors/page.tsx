'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/(context)/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  UserGroupIcon, 
  GlobeAltIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';

interface Visit {
  id: string;
  path: string;
  sessionId: string;
  browser: string;
  os: string;
  isMobile: boolean;
  language: string;
  referrer: string;
  timestamp: Timestamp;
  lastSeen: Timestamp;
  pageCount?: number;
  isActive?: boolean;
}

interface Stats {
  totalVisits: number;
  activeSessions: number;
  uniqueVisitors: number;
  mobileVisits: number;
  desktopVisits: number;
  topBrowsers: { [key: string]: number };
  topPages: { [key: string]: number };
}

export default function VisitorsPage() {
  const { user, firebaseUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalVisits: 0,
    activeSessions: 0,
    uniqueVisitors: 0,
    mobileVisits: 0,
    desktopVisits: 0,
    topBrowsers: {},
    topPages: {},
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'realtime' | 'today' | 'week' | 'month' | 'year'>('realtime');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [viewMode, setViewMode] = useState<'realtime' | 'history'>('realtime');
  const [historyData, setHistoryData] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !user.admin) {
        router.push('/admin/login');
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!firebaseUser || !user?.admin || viewMode !== 'realtime') return;

    setLoading(true);

    // Requête pour les sessions actives (temps réel)
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 60 * 1000); // 30 dernières minutes
    const startTimestamp = Timestamp.fromDate(startDate);

    // Écouter les sessions actives en temps réel
    const sessionsQuery = query(
      collection(db, 'active_sessions'),
      where('lastSeen', '>=', startTimestamp),
      where('isActive', '==', true),
      orderBy('lastSeen', 'desc'),
      limit(50)
    );

    const unsubscribeSessions = onSnapshot(
      sessionsQuery,
      (snapshot) => {
        const visitsData: Visit[] = [];
        const statsData: Stats = {
          totalVisits: 0,
          activeSessions: 0,
          uniqueVisitors: 0,
          mobileVisits: 0,
          desktopVisits: 0,
          topBrowsers: {},
          topPages: {},
        };

        const uniqueSessions = new Set<string>();
        const browsers: { [key: string]: number } = {};
        const pages: { [key: string]: number } = {};

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          visitsData.push({
            id: doc.id,
            ...data,
          } as Visit);

          uniqueSessions.add(data.sessionId);
          statsData.activeSessions = uniqueSessions.size;
          statsData.totalVisits += data.pageCount || 1;

          if (data.isMobile) {
            statsData.mobileVisits++;
          } else {
            statsData.desktopVisits++;
          }

          browsers[data.browser] = (browsers[data.browser] || 0) + 1;
          pages[data.path] = (pages[data.path] || 0) + 1;
        });

        statsData.uniqueVisitors = uniqueSessions.size;
        statsData.topBrowsers = browsers;
        statsData.topPages = pages;

        setVisits(visitsData);
        setStats(statsData);
        setLoading(false);
      },
      (error) => {
        console.error('Erreur écoute sessions:', error);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeSessions();
    };
  }, [firebaseUser, user, viewMode]);

  // Auto-refresh pour le temps réel
  useEffect(() => {
    if (!autoRefresh || timeRange !== 'realtime' || viewMode !== 'realtime') return;

    const interval = setInterval(() => {
      // Le listener Firestore se mettra à jour automatiquement
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh, timeRange, viewMode]);

  // Charger l'historique
  useEffect(() => {
    if (viewMode !== 'history' || !firebaseUser || !user?.admin) return;

    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const token = await firebaseUser.getIdToken();
        const range = timeRange === 'realtime' ? 'year' : timeRange;
        const response = await fetch(`/api/admin/visitors/history?range=${range}&limit=5000`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setHistoryData(data);
        } else {
          console.error('Erreur chargement historique');
        }
      } catch (error) {
        console.error('Erreur historique:', error);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [viewMode, timeRange, firebaseUser, user]);

  const formatTime = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    return date.toLocaleString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UserGroupIcon className="w-6 h-6" />
            {viewMode === 'realtime' ? 'Visiteurs en temps réel' : 'Historique des visiteurs'}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {viewMode === 'realtime' 
              ? 'Suivi des visiteurs actifs sur le site'
              : 'Analyse historique jusqu\'à un an'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>
          <button
            onClick={() => window.location.reload()}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            title="Actualiser"
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mode de visualisation */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('realtime')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'realtime'
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Temps réel
          </button>
          <button
            onClick={() => setViewMode('history')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'history'
                ? 'bg-purple-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Historique
          </button>
        </div>

        {/* Filtres de période */}
        {viewMode === 'history' && (
          <div className="flex gap-2 flex-wrap">
            {(['today', 'week', 'month', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {range === 'today' ? "Aujourd'hui" :
                 range === 'week' ? '7 jours' :
                 range === 'month' ? '30 jours' :
                 '1 an'}
              </button>
            ))}
          </div>
        )}

        {viewMode === 'realtime' && (
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setTimeRange('realtime')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === 'realtime'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Dernières 30 min
            </button>
          </div>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sessions actives</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.activeSessions}
              </p>
            </div>
            <UserGroupIcon className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pages vues</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.totalVisits}
              </p>
            </div>
            <GlobeAltIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Mobile</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.mobileVisits}
              </p>
            </div>
            <DevicePhoneMobileIcon className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Desktop</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.desktopVisits}
              </p>
            </div>
            <ComputerDesktopIcon className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Top Browsers et Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5" />
            Navigateurs
          </h3>
          <div className="space-y-2">
            {Object.entries(stats.topBrowsers)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([browser, count]) => (
                <div key={browser} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{browser}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{count}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <GlobeAltIcon className="w-5 h-5" />
            Pages populaires
          </h3>
          <div className="space-y-2">
            {Object.entries(stats.topPages)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([path, count]) => (
                <div key={path} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{path}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white ml-2">{count}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Liste des visiteurs */}
      {viewMode === 'realtime' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Visiteurs actifs ({visits.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {visits.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                Aucun visiteur actif
              </div>
            ) : (
              visits.map((visit) => (
                <div key={visit.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${visit.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {visit.path}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <span>{visit.browser}</span>
                            <span>•</span>
                            <span>{visit.os}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              {visit.isMobile ? (
                                <DevicePhoneMobileIcon className="w-3 h-3" />
                              ) : (
                                <ComputerDesktopIcon className="w-3 h-3" />
                              )}
                            </span>
                            <span>•</span>
                            <span>{visit.language}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          {formatTime(visit.lastSeen)}
                        </p>
                        {visit.pageCount && visit.pageCount > 1 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {visit.pageCount} pages
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {historyLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : historyData ? (
            <>
              {/* Statistiques historiques */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total visites</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {historyData.stats.total.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sessions uniques</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {historyData.stats.uniqueSessions.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mobile</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {historyData.stats.mobile.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Desktop</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {historyData.stats.desktop.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Top Browsers et OS */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Navigateurs
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(historyData.stats.browsers)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 10)
                      .map(([browser, count]) => (
                        <div key={browser} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{browser}</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {count.toLocaleString()}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Systèmes d'exploitation
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(historyData.stats.os)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .slice(0, 10)
                      .map(([os, count]) => (
                        <div key={os} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{os}</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {count.toLocaleString()}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {/* Pages populaires */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Pages les plus visitées
                </h3>
                <div className="space-y-2">
                  {Object.entries(historyData.stats.pages)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 20)
                    .map(([path, count]) => (
                      <div key={path} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{path}</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white ml-4">
                          {count.toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Aucune donnée historique disponible
            </div>
          )}
        </div>
      )}
    </div>
  );
}

