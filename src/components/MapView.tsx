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
    style?: React.CSSProperties;
}

export default function MapView({
    route,
    isAnimating = false,
    currentPointIndex = 0,
    className = '',
    style,
}: MapViewProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const polylineRef = useRef<L.Polyline | null>(null);
    const markerRef = useRef<L.CircleMarker | null>(null);

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        const darkTileLayer = L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                subdomains: 'abcd',
                maxZoom: 19,
            }
        );

        const map = L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: false,
        }).setView([35.6762, 139.6503], 10);

        darkTileLayer.addTo(map);
        L.control.attribution({ position: 'bottomright', prefix: false }).addTo(map);

        mapInstanceRef.current = map;

        // Force resize after mount
        setTimeout(() => map.invalidateSize(), 100);

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    // Update route
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || route.length === 0) return;

        if (polylineRef.current) map.removeLayer(polylineRef.current);
        if (markerRef.current) map.removeLayer(markerRef.current);

        const latLngs = route.map((p) => [p.lat, p.lng] as [number, number]);

        const polyline = L.polyline(latLngs, {
            color: '#8B5CF6',
            weight: 3,
            opacity: 0.8,
        }).addTo(map);

        L.polyline(latLngs, {
            color: '#8B5CF6',
            weight: 8,
            opacity: 0.2,
        }).addTo(map);

        polylineRef.current = polyline;

        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, { padding: [30, 30] });

        // Force resize
        setTimeout(() => map.invalidateSize(), 100);
    }, [route]);

    // Animation
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !isAnimating || route.length === 0) return;

        const point = route[currentPointIndex];
        if (!point) return;

        map.flyTo([point.lat, point.lng], 14, {
            duration: 2,
            easeLinearity: 0.25,
        });

        if (markerRef.current) map.removeLayer(markerRef.current);

        const marker = L.circleMarker([point.lat, point.lng], {
            radius: 8,
            fillColor: '#EC4899',
            fillOpacity: 1,
            color: '#fff',
            weight: 2,
        }).addTo(map);

        markerRef.current = marker;
    }, [isAnimating, currentPointIndex, route]);

    return (
        <div
            className={className}
            style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                ...style,
            }}
        >
            <div
                ref={mapRef}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100%',
                    height: '100%',
                }}
            />
        </div>
    );
}
