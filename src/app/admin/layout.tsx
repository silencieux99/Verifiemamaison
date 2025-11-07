'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/(context)/AuthContext';
import { AdminSidebar, AdminTopbar, AdminToast } from './(components)';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Check if we're on the login page or register page (pages publiques)
  const isLoginPage = pathname === '/admin/login';
  const isRegisterPage = pathname === '/admin/register';
  const isPublicPage = isLoginPage || isRegisterPage;

  useEffect(() => {
    // Attendre que l'authentification soit complètement chargée
    if (authLoading) {
      return;
    }
    
    // Vérifier l'admin access sur toutes les routes admin (sauf login et register)
    if (!isPublicPage && (!user || !user.admin)) {
      router.push('/admin/login');
    }
  }, [user, authLoading, router, pathname, isPublicPage]);

  useEffect(() => {
    // Initialiser le dark mode depuis le localStorage ou prefers-color-scheme
    const saved = localStorage.getItem('admin-dark-mode');
    if (saved !== null) {
      setDarkMode(JSON.parse(saved));
    } else {
      setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  useEffect(() => {
    // Appliquer le dark mode
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('admin-dark-mode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Afficher loading pendant la vérification auth (sauf sur les pages publiques)
  if (authLoading && !isPublicPage) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si on est sur une page publique (login ou register), la rendre directement sans layout admin
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Ne pas render les composants admin si pas connecté ou pas admin (mais pas sur login)
  if (!user || !user.admin) {
    return null;
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${darkMode ? 'dark' : ''}`}>
      {/* Sidebar Desktop */}
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        darkMode={darkMode}
      />
      
      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <AdminTopbar 
          onMenuClick={() => setSidebarOpen(true)}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />
        
        {/* Page Content */}
        <main className="px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-5 lg:py-6">
          {children}
        </main>
      </div>

      {/* Toast Container */}
      <AdminToast />
    </div>
  );
}

