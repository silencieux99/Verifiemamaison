'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Composant de tracking des pages visitées en temps réel
 * Enregistre chaque visite dans Firestore pour l'admin
 */
export default function PageTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);
  const sessionId = useRef<string | null>(null);

  useEffect(() => {
    // Générer un ID de session unique si pas déjà fait
    if (!sessionId.current) {
      sessionId.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Éviter de tracker la même page deux fois de suite
    if (lastTrackedPath.current === pathname) {
      return;
    }

    lastTrackedPath.current = pathname;

    // Récupérer les informations du visiteur
    const trackVisit = async () => {
      try {
        // Récupérer les informations du navigateur
        const userAgent = navigator.userAgent;
        const language = navigator.language || navigator.languages?.[0] || 'unknown';
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const referrer = document.referrer || 'direct';
        const timestamp = new Date().toISOString();

        // Envoyer les données à l'API
        await fetch('/api/track-visit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: pathname,
            sessionId: sessionId.current,
            userAgent,
            language,
            screenWidth,
            screenHeight,
            viewportWidth,
            viewportHeight,
            referrer,
            timestamp,
          }),
        });
      } catch (error) {
        // Ignorer les erreurs silencieusement pour ne pas perturber l'expérience utilisateur
        console.debug('Erreur tracking visite:', error);
      }
    };

    // Délai pour éviter de tracker trop rapidement
    const timeoutId = setTimeout(trackVisit, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [pathname]);

  return null;
}

