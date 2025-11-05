'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Composant de tracking des pages visitées
 */
export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Tracking de la page visitée
    // À adapter selon les besoins
  }, [pathname]);

  return null;
}

