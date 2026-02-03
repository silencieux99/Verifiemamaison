
'use client';

import { useEffect, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface PropertyMapProps {
    lat: number;
    lon: number;
    address: string;
}

export default function PropertyMap({ lat, lon, address }: PropertyMapProps) {
    const [isClient, setIsClient] = useState(false);
    const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

    // Unique ID for this map instance
    const mapId = useMemo(() => `map-${Math.random().toString(36).substr(2, 9)}`, []);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;

        // Cleanup previous map if exists
        if (mapInstance) {
            mapInstance.remove();
            setMapInstance(null);
        }

        // Wait for DOM to be ready
        const timer = setTimeout(() => {
            const container = document.getElementById(mapId);
            if (!container) return;

            // Check if container already has a map
            if ((container as any)._leaflet_id) {
                return;
            }

            try {
                const map = L.map(mapId, {
                    center: [lat, lon],
                    zoom: 16,
                    scrollWheelZoom: false,
                    zoomControl: true
                });

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                }).addTo(map);

                const icon = L.icon({
                    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                });

                L.marker([lat, lon], { icon })
                    .addTo(map)
                    .bindPopup(`<div class="text-xs font-medium">${address}</div>`);

                setMapInstance(map);
            } catch (error) {
                console.error('Error initializing map:', error);
            }
        }, 100);

        return () => {
            clearTimeout(timer);
            if (mapInstance) {
                mapInstance.remove();
            }
        };
    }, [isClient, lat, lon, address, mapId]);

    if (!isClient) {
        return (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <div className="text-gray-400 text-sm">Chargement de la carte...</div>
            </div>
        );
    }

    return (
        <div
            id={mapId}
            className="w-full h-full rounded-2xl"
            style={{ minHeight: '300px' }}
        />
    );
}
