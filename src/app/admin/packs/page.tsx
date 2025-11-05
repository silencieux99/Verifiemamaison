'use client';

import { useEffect } from 'react';
import { useAuth } from '@/app/(context)/AuthContext';
import { useRouter } from 'next/navigation';

export default function PacksPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user || !user.admin) {
      router.push('/admin/login');
    }
  }, [user, router]);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Packs & Crédits
      </h1>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-600 dark:text-gray-400">
          Gestion des packs et crédits utilisateurs - À implémenter
        </p>
      </div>
    </div>
  );
}

