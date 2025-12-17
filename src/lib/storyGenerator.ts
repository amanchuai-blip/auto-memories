import type { Photo, RoutePoint } from '@/types';

// Reverse geocoding - get location name from coordinates
// This is a simplified version using timezone-based estimation
export function getLocationName(lat: number, lng: number): string {
    // Japan regions based on coordinates
    if (lat >= 35.5 && lat <= 35.8 && lng >= 139.5 && lng <= 140.0) return '東京';
    if (lat >= 34.6 && lat <= 35.1 && lng >= 135.3 && lng <= 135.8) return '京都・大阪';
    if (lat >= 35.1 && lat <= 35.5 && lng >= 136.8 && lng <= 137.2) return '名古屋';
    if (lat >= 43.0 && lat <= 43.2 && lng >= 141.2 && lng <= 141.5) return '札幌';
    if (lat >= 33.5 && lat <= 33.7 && lng >= 130.3 && lng <= 130.5) return '福岡';
    if (lat >= 34.3 && lat <= 34.5 && lng >= 132.4 && lng <= 132.6) return '広島';
    if (lat >= 26.1 && lat <= 26.5 && lng >= 127.6 && lng <= 128.0) return '沖縄';

    // Generic based on latitude
    if (lat > 40) return '北日本';
    if (lat > 35) return '関東・中部';
    if (lat > 33) return '関西・中国';
    return '南日本';
}

// Get time of day description
export function getTimeOfDay(hour: number): string {
    if (hour >= 5 && hour < 7) return '早朝';
    if (hour >= 7 && hour < 10) return '朝';
    if (hour >= 10 && hour < 12) return '午前';
    if (hour >= 12 && hour < 14) return '昼';
    if (hour >= 14 && hour < 17) return '午後';
    if (hour >= 17 && hour < 19) return '夕方';
    if (hour >= 19 && hour < 22) return '夜';
    return '深夜';
}

// Get weather/atmosphere description (simulated)
export function getAtmosphere(hour: number, altitude?: number): string {
    const atmospheres = [];

    if (hour >= 5 && hour < 7) atmospheres.push('朝靄の中');
    if (hour >= 6 && hour < 8) atmospheres.push('朝日を浴びながら');
    if (hour >= 17 && hour < 19) atmospheres.push('夕焼けに染まる');
    if (hour >= 19 && hour < 22) atmospheres.push('夜の帳が降りる中');

    if (altitude && altitude > 1000) atmospheres.push('山の空気を感じながら');
    if (altitude && altitude < 10) atmospheres.push('潮風を感じながら');

    return atmospheres[Math.floor(Math.random() * atmospheres.length)] || '';
}

// Generate story narrative for a photo
export function generatePhotoNarrative(
    photo: Photo,
    prevPhoto: Photo | null,
    index: number,
    total: number
): string {
    const hour = photo.timestamp.getHours();
    const timeOfDay = getTimeOfDay(hour);
    const timeStr = photo.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });

    // First photo
    if (index === 0) {
        const location = photo.latitude && photo.longitude
            ? getLocationName(photo.latitude, photo.longitude)
            : '';
        return location
            ? `${timeOfDay}${timeStr}、${location}から旅が始まった`
            : `${timeOfDay}${timeStr}、旅が始まった`;
    }

    // Last photo
    if (index === total - 1) {
        return '旅の終わり、思い出を胸に';
    }

    // Check time gap from previous photo
    if (prevPhoto) {
        const gapHours = (photo.timestamp.getTime() - prevPhoto.timestamp.getTime()) / (1000 * 60 * 60);

        if (gapHours > 24) {
            const days = Math.floor(gapHours / 24);
            return `${days}日後...`;
        }

        if (gapHours > 6) {
            return `${timeOfDay}...`;
        }
    }

    // Location-based narrative
    if (photo.latitude && photo.longitude) {
        const location = getLocationName(photo.latitude, photo.longitude);
        const atmosphere = getAtmosphere(hour, photo.altitude);

        if (atmosphere) {
            return `${atmosphere}${location}にて`;
        }
        return `${location}`;
    }

    // Time-based narrative
    const narratives = [
        `${timeOfDay}の一瞬`,
        `記憶に残る瞬間`,
        `旅の途中で`,
        `ふと立ち止まって`,
    ];

    return narratives[index % narratives.length];
}

// Calculate speed between two photos
export function calculateSpeed(from: Photo, to: Photo): number {
    if (!from.latitude || !from.longitude || !to.latitude || !to.longitude) return 0;

    const R = 6371; // km
    const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
    const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((from.latitude * Math.PI) / 180) *
        Math.cos((to.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    const hours = (to.timestamp.getTime() - from.timestamp.getTime()) / (1000 * 60 * 60);
    if (hours <= 0) return 0;

    return Math.round(distance / hours);
}

// Calculate cumulative distance up to a photo
export function calculateCumulativeDistance(photos: Photo[], upToIndex: number): number {
    let total = 0;
    for (let i = 1; i <= upToIndex && i < photos.length; i++) {
        const from = photos[i - 1];
        const to = photos[i];
        if (from.latitude && from.longitude && to.latitude && to.longitude) {
            const R = 6371;
            const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
            const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos((from.latitude * Math.PI) / 180) *
                Math.cos((to.latitude * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            total += R * c;
        }
    }
    return Math.round(total * 10) / 10;
}

// Get time gap label between photos
export function getTimeGapLabel(from: Photo, to: Photo): string | null {
    const gapHours = (to.timestamp.getTime() - from.timestamp.getTime()) / (1000 * 60 * 60);

    if (gapHours >= 24) {
        const days = Math.floor(gapHours / 24);
        if (days === 1) return '翌日';
        return `${days}日後`;
    }

    if (gapHours >= 12) return '半日後';
    if (gapHours >= 6) return '数時間後';

    return null;
}

// Ken Burns effect parameters
export interface KenBurnsParams {
    startScale: number;
    endScale: number;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
}

export function generateKenBurnsParams(index: number): KenBurnsParams {
    const patterns: KenBurnsParams[] = [
        { startScale: 1, endScale: 1.3, startX: 0, startY: 0, endX: -5, endY: -5 },
        { startScale: 1.3, endScale: 1, startX: -5, startY: 5, endX: 0, endY: 0 },
        { startScale: 1, endScale: 1.2, startX: 5, startY: 0, endX: -5, endY: 5 },
        { startScale: 1.2, endScale: 1, startX: 0, startY: -5, endX: 5, endY: 0 },
        { startScale: 1.1, endScale: 1.3, startX: -3, startY: -3, endX: 3, endY: 3 },
    ];

    return patterns[index % patterns.length];
}
