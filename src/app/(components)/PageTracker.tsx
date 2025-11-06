'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Composant de tracking des pages visitées en temps réel
 * Enregistre chaque visite dans Firestore pour l'admin
 * Envoie un heartbeat régulier pour maintenir la session active
 */
export default function PageTracker() {
  const pathname = usePathname();
  const lastTrackedPath = useRef<string | null>(null);
  const sessionId = useRef<string | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour tracker une visite ou envoyer un heartbeat
  const trackVisit = async (isHeartbeat = false) => {
    try {
      // Générer un ID de session unique si pas déjà fait
      if (!sessionId.current) {
        sessionId.current = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }

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
          isHeartbeat, // Indique si c'est un heartbeat ou une nouvelle visite
        }),
      });
    } catch (error) {
      // Ignorer les erreurs silencieusement pour ne pas perturber l'expérience utilisateur
      console.debug('Erreur tracking visite:', error);
    }
  };

  // Tracker le changement de page
  useEffect(() => {
    // Éviter de tracker la même page deux fois de suite
    if (lastTrackedPath.current === pathname) {
      return;
    }

    lastTrackedPath.current = pathname;

    // Délai pour éviter de tracker trop rapidement
    const timeoutId = setTimeout(() => {
      trackVisit(false);
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [pathname]);

  // Heartbeat régulier pour maintenir la session active (toutes les 20 secondes)
  useEffect(() => {
    // Démarrer le heartbeat après un court délai initial
    const startHeartbeat = setTimeout(() => {
      heartbeatInterval.current = setInterval(() => {
        trackVisit(true);
      }, 20000); // 20 secondes
    }, 5000); // Démarrer après 5 secondes

    // Nettoyer l'intervalle au démontage
    return () => {
      clearTimeout(startHeartbeat);
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
    };
  }, []);

  // Envoyer un signal de déconnexion quand l'utilisateur quitte
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Envoyer une dernière requête pour marquer la session comme inactive
      if (sessionId.current) {
        // Utiliser sendBeacon avec FormData pour une requête fiable même si la page se ferme
        const formData = new FormData();
        formData.append('sessionId', sessionId.current);
        formData.append('isLeaving', 'true');
        navigator.sendBeacon('/api/track-visit', formData);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, []);

  return null;
}

