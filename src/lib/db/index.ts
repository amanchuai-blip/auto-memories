import Dexie, { type EntityTable } from 'dexie';
import type { Trip, Photo } from '@/types';

// Database schema
export const db = new Dexie('AutoMemoriesDB') as Dexie & {
    trips: EntityTable<Trip, 'id'>;
    photos: EntityTable<Photo, 'id'>;
};

db.version(1).stores({
    trips: 'id, createdAt, updatedAt, name',
    photos: 'id, tripId, timestamp',
});

// Helper functions
export async function createTrip(trip: Trip): Promise<string> {
    return await db.trips.add(trip);
}

export async function updateTrip(id: string, updates: Partial<Trip>): Promise<void> {
    await db.trips.update(id, { ...updates, updatedAt: new Date() });
}

export async function deleteTrip(id: string): Promise<void> {
    await db.transaction('rw', db.trips, db.photos, async () => {
        await db.photos.where('tripId').equals(id).delete();
        await db.trips.delete(id);
    });
}

export async function getTrip(id: string): Promise<Trip | undefined> {
    return await db.trips.get(id);
}

export async function getAllTrips(): Promise<Trip[]> {
    return await db.trips.orderBy('createdAt').reverse().toArray();
}

export async function addPhotosToTrip(tripId: string, photos: Photo[]): Promise<void> {
    await db.photos.bulkAdd(photos);
}

export async function getPhotosForTrip(tripId: string): Promise<Photo[]> {
    return await db.photos.where('tripId').equals(tripId).sortBy('timestamp');
}

export async function deletePhoto(id: string): Promise<void> {
    await db.photos.delete(id);
}
