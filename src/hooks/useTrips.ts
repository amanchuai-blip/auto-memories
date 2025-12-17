'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db, createTrip, updateTrip, deleteTrip, getAllTrips, getTrip, addPhotosToTrip, getPhotosForTrip } from '@/lib/db';
import type { Trip, Photo } from '@/types';

export function useTrips() {
    const trips = useLiveQuery(() => getAllTrips(), []);

    return {
        trips: trips ?? [],
        isLoading: trips === undefined,
        createTrip,
        updateTrip,
        deleteTrip,
    };
}

export function useTrip(tripId: string | null) {
    const trip = useLiveQuery(
        () => (tripId ? getTrip(tripId) : undefined),
        [tripId]
    );

    const photos = useLiveQuery(
        () => (tripId ? getPhotosForTrip(tripId) : []),
        [tripId]
    );

    return {
        trip,
        photos: photos ?? [],
        isLoading: trip === undefined || photos === undefined,
        updateTrip: (updates: Partial<Trip>) => tripId && updateTrip(tripId, updates),
        addPhotos: (newPhotos: Photo[]) => tripId && addPhotosToTrip(tripId, newPhotos),
    };
}
