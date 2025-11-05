'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/app/(context)/AuthContext';
import { getUserCredits } from '@/lib/user';
import { HomeIcon } from '@heroicons/react/24/outline';

/**
 * Affichage des crédits restants dans le header (version desktop)
 */
export function CreditsDisplay() {
  const { firebaseUser } = useAuth();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) {
      setCredits(null);
      setLoading(false);
      return;
    }

    const fetchCredits = async () => {
      try {
        const userCredits = await getUserCredits(firebaseUser.uid);
        setCredits(userCredits);
      } catch (error) {
        console.error('Erreur lors de la récupération des crédits:', error);
        setCredits(0);
      } finally {
        setLoading(false);
      }
    };

    fetchCredits();
    
    // Réactualiser toutes les 30 secondes
    const interval = setInterval(fetchCredits, 30000);
    return () => clearInterval(interval);
  }, [firebaseUser]);

  if (!firebaseUser) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <div className="h-4 w-4 animate-pulse bg-gray-600 rounded"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-purple-600/20 border border-purple-500/30 px-3 py-1.5 rounded-lg">
      <HomeIcon className="h-4 w-4 text-purple-400" />
      <span className="text-sm font-medium text-white">
        {credits !== null ? `${credits} rapport${credits > 1 ? 's' : ''}` : '0 rapport'}
      </span>
    </div>
  );
}

