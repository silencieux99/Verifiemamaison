'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapComponentProps {
  lat: number;
  lon: number;
  address?: string;
  zoom?: number;
}

export default function MapComponent({ lat, lon, address, zoom = 15 }: MapComponentProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialiser la carte
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([lat, lon], zoom);

      // Ajouter les tuiles OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);

      // Ajouter un marqueur personnalisé
      const purpleIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              transform: rotate(45deg);
              color: white;
              font-size: 20px;
              font-weight: bold;
            ">🏠</div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
      });

      const marker = L.marker([lat, lon], { icon: purpleIcon }).addTo(mapRef.current);

      if (address) {
        marker.bindPopup(`<div style="font-weight: 600; color: #9333ea;">${address}</div>`).openPopup();
      }
    } else {
      // Mettre à jour la vue si les coordonnées changent
      mapRef.current.setView([lat, lon], zoom);
    }

    // Cleanup
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lon, address, zoom]);

  return (
    <div 
      ref={mapContainerRef}
      className="w-full h-full rounded-xl overflow-hidden"
      style={{ minHeight: '300px', zIndex: 0 }}
    />
  );
}

