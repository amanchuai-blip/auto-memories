'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RoutePoint } from '@/types';

interface MapViewProps {
    route: RoutePoint[];
    isAnimating?: boolean;
    currentPointIndex?: number;
    onAnimationComplete?: () => void;
    className?: string;
}

export default function MapView({
    route,
    isAnimating = false,
    currentPointIndex = 0,
    className = '',
}: MapViewProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const polylineRef = useRef<L.Polyline | null>(null);
    const markerRef = useRef<L.CircleMarker | null>(null);

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        // CartoDB Positron tiles for cinematic look
        const tileLayer = L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
            {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19,
            }
        );

        // Dark variant for cinematic look
        const darkTileLayer = L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                maxZoom: 19,
            }
        );

        const map = L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: false,
        }).setView([35.6762, 139.6503], 10); // Default to Tokyo

        // Use dark tiles for cinematic effect
        darkTileLayer.addTo(map);

        // Add minimal attribution
        L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    // Update route visualization
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || route.length === 0) return;

        // Remove existing polyline and marker
        if (polylineRef.current) {
            map.removeLayer(polylineRef.current);
        }
        if (markerRef.current) {
            map.removeLayer(markerRef.current);
        }

        // Create route line
        const latLngs = route.map((p) => [p.lat, p.lng] as [number, number]);

        // Gradient-like effect with multiple polylines
        const polyline = L.polyline(latLngs, {
            color: '#8B5CF6',
            weight: 3,
            opacity: 0.8,
            lineCap: 'round',
            lineJoin: 'round',
        }).addTo(map);

        // Glow effect
        L.polyline(latLngs, {
            color: '#8B5CF6',
            weight: 8,
            opacity: 0.2,
            lineCap: 'round',
            lineJoin: 'round',
        }).addTo(map);

        polylineRef.current = polyline;

        // Fit bounds to show entire route
        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, { padding: [50, 50] });
    }, [route]);

    // Handle animation - fly to current point
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !isAnimating || route.length === 0) return;

        const point = route[currentPointIndex];
        if (!point) return;

        // Animate to current point
        map.flyTo([point.lat, point.lng], 14, {
            duration: 2,
            easeLinearity: 0.25,
        });

        // Update marker position
        if (markerRef.current) {
            map.removeLayer(markerRef.current);
        }

        const marker = L.circleMarker([point.lat, point.lng], {
            radius: 8,
            fillColor: '#EC4899',
            fillOpacity: 1,
            color: '#fff',
            weight: 2,
        }).addTo(map);

        // Pulse effect
        const pulseMarker = L.circleMarker([point.lat, point.lng], {
            radius: 8,
            fillColor: '#EC4899',
            fillOpacity: 0.5,
            color: '#EC4899',
            weight: 0,
            className: 'pulse-marker',
        }).addTo(map);

        markerRef.current = marker;

        return () => {
            if (pulseMarker) {
                map.removeLayer(pulseMarker);
            }
        };
    }, [isAnimating, currentPointIndex, route]);

    return (
        <div className={`relative ${className}`}>
            <div ref={mapRef} className="w-full h-full" />
            <style jsx global>{`
        .pulse-marker {
          animation: pulse 2s ease-out infinite;
        }
        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          100% {
            transform: scale(3);
            opacity: 0;
          }
        }
      `}</style>
        </div>
    );
}
