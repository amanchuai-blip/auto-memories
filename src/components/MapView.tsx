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

// Japan bounds
const JAPAN_BOUNDS = L.latLngBounds(
    [24.0, 122.0], // Southwest
    [46.0, 146.0]  // Northeast
);

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
    const photoMarkersRef = useRef<L.CircleMarker[]>([]);

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        const darkTileLayer = L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            {
                attribution: '&copy; OpenStreetMap',
                subdomains: 'abcd',
                maxZoom: 18,
                minZoom: 5,
            }
        );

        const map = L.map(mapRef.current, {
            zoomControl: false,
            attributionControl: false,
            maxBounds: JAPAN_BOUNDS,
            maxBoundsViscosity: 1.0,
        }).setView([36.0, 138.0], 6); // Center of Japan

        darkTileLayer.addTo(map);
        mapInstanceRef.current = map;

        // Force resize
        setTimeout(() => map.invalidateSize(), 100);
        setTimeout(() => map.invalidateSize(), 500);

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []);

    // Update route and add photo markers
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || route.length === 0) return;

        // Clear existing
        if (polylineRef.current) map.removeLayer(polylineRef.current);
        if (markerRef.current) map.removeLayer(markerRef.current);
        photoMarkersRef.current.forEach(m => map.removeLayer(m));
        photoMarkersRef.current = [];

        const latLngs = route.map((p) => [p.lat, p.lng] as [number, number]);

        // Route line
        const polyline = L.polyline(latLngs, {
            color: '#8B5CF6',
            weight: 4,
            opacity: 0.9,
        }).addTo(map);

        // Glow
        L.polyline(latLngs, {
            color: '#8B5CF6',
            weight: 10,
            opacity: 0.3,
        }).addTo(map);

        polylineRef.current = polyline;

        // Photo markers - show all photo locations
        route.forEach((point, i) => {
            const marker = L.circleMarker([point.lat, point.lng], {
                radius: 6,
                fillColor: '#ffffff',
                fillOpacity: 0.8,
                color: '#8B5CF6',
                weight: 2,
            }).addTo(map);
            photoMarkersRef.current.push(marker);
        });

        // Fit bounds with padding
        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, {
            padding: [40, 40],
            maxZoom: 15,
        });

        // Force resize
        setTimeout(() => map.invalidateSize(), 100);
    }, [route]);

    // Animation - fly to current point
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map || !isAnimating || route.length === 0) return;

        const point = route[currentPointIndex];
        if (!point) return;

        // Calculate appropriate zoom based on route spread
        const bounds = L.latLngBounds(route.map(p => [p.lat, p.lng] as [number, number]));
        const boundsSize = bounds.getNorthEast().distanceTo(bounds.getSouthWest());

        // Zoom level: closer for shorter distances
        let targetZoom = 14;
        if (boundsSize > 100000) targetZoom = 10;
        else if (boundsSize > 50000) targetZoom = 11;
        else if (boundsSize > 20000) targetZoom = 12;
        else if (boundsSize > 10000) targetZoom = 13;

        map.flyTo([point.lat, point.lng], targetZoom, {
            duration: 1.5,
            easeLinearity: 0.3,
        });

        // Update current marker
        if (markerRef.current) map.removeLayer(markerRef.current);

        const marker = L.circleMarker([point.lat, point.lng], {
            radius: 10,
            fillColor: '#EC4899',
            fillOpacity: 1,
            color: '#fff',
            weight: 3,
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
