import type { Achievement, AchievementType, Photo, RoutePoint } from '@/types';

// Calculate distance between two GPS coordinates in km (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function generateId(): string {
    return crypto.randomUUID();
}

function createAchievement(type: AchievementType, metadata?: Record<string, unknown>): Achievement {
    return { id: generateId(), type, unlockedAt: new Date(), metadata };
}

// Helper: Check if number is prime
function isPrime(n: number): boolean {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    for (let i = 3; i <= Math.sqrt(n); i += 2) {
        if (n % i === 0) return false;
    }
    return true;
}

// Helper: Check if number is fibonacci
function isFibonacci(n: number): boolean {
    const fibs = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610, 987];
    return fibs.includes(n);
}

// Helper: Check if number is palindrome
function isPalindrome(n: number): boolean {
    const str = n.toString();
    return str === str.split('').reverse().join('') && str.length >= 2;
}

// ========== SPEED & MOVEMENT ==========

function checkTeleporter(photos: Photo[]): Achievement | null {
    const gpsPhotos = photos.filter((p) => p.latitude != null && p.longitude != null);
    for (let i = 1; i < gpsPhotos.length; i++) {
        const prev = gpsPhotos[i - 1];
        const curr = gpsPhotos[i];
        const distance = calculateDistance(prev.latitude!, prev.longitude!, curr.latitude!, curr.longitude!);
        const timeDiffHours = (curr.timestamp.getTime() - prev.timestamp.getTime()) / (1000 * 60 * 60);
        if (timeDiffHours > 0 && distance / timeDiffHours > 150 && distance / timeDiffHours < 500) {
            return createAchievement('teleporter', { speed: Math.round(distance / timeDiffHours) });
        }
    }
    return null;
}

function checkJetSetter(photos: Photo[]): Achievement | null {
    const gpsPhotos = photos.filter((p) => p.latitude != null && p.longitude != null);
    for (let i = 1; i < gpsPhotos.length; i++) {
        const prev = gpsPhotos[i - 1];
        const curr = gpsPhotos[i];
        const distance = calculateDistance(prev.latitude!, prev.longitude!, curr.latitude!, curr.longitude!);
        const timeDiffHours = (curr.timestamp.getTime() - prev.timestamp.getTime()) / (1000 * 60 * 60);
        if (timeDiffHours > 0 && distance / timeDiffHours > 500) {
            return createAchievement('jet_setter', { speed: Math.round(distance / timeDiffHours) });
        }
    }
    return null;
}

function checkSlowpoke(photos: Photo[]): Achievement | null {
    const gpsPhotos = photos.filter((p) => p.latitude != null && p.longitude != null);
    if (gpsPhotos.length < 3) return null;
    for (let i = 1; i < gpsPhotos.length; i++) {
        const prev = gpsPhotos[i - 1];
        const curr = gpsPhotos[i];
        const distance = calculateDistance(prev.latitude!, prev.longitude!, curr.latitude!, curr.longitude!);
        const timeDiffHours = (curr.timestamp.getTime() - prev.timestamp.getTime()) / (1000 * 60 * 60);
        if (timeDiffHours > 0 && distance / timeDiffHours > 5) return null;
    }
    return createAchievement('slowpoke');
}

function checkMarathonRunner(photos: Photo[], totalDistance: number): Achievement | null {
    if (totalDistance >= 42) {
        return createAchievement('marathon_runner', { distance: totalDistance });
    }
    return null;
}

// ========== TIME-BASED ==========

function checkEarlyBird(photos: Photo[]): Achievement | null {
    for (const photo of photos) {
        const hour = photo.timestamp.getHours();
        if (hour >= 5 && hour < 7) {
            return createAchievement('early_bird', { time: photo.timestamp.toISOString() });
        }
    }
    return null;
}

function checkNightOwl(photos: Photo[]): Achievement | null {
    for (const photo of photos) {
        const hour = photo.timestamp.getHours();
        if (hour >= 2 && hour < 4) {
            return createAchievement('night_owl', { time: photo.timestamp.toISOString() });
        }
    }
    return null;
}

function checkGoldenHour(photos: Photo[]): Achievement | null {
    for (const photo of photos) {
        const hour = photo.timestamp.getHours();
        if ((hour >= 6 && hour < 8) || (hour >= 17 && hour < 19)) {
            return createAchievement('golden_hour', { time: photo.timestamp.toISOString() });
        }
    }
    return null;
}

function checkMidnightExplorer(photos: Photo[]): Achievement | null {
    for (const photo of photos) {
        const hour = photo.timestamp.getHours();
        const min = photo.timestamp.getMinutes();
        if (hour === 0 && min <= 5) {
            return createAchievement('midnight_explorer', { time: photo.timestamp.toISOString() });
        }
        if (hour === 23 && min >= 55) {
            return createAchievement('midnight_explorer', { time: photo.timestamp.toISOString() });
        }
    }
    return null;
}

function checkWeekendWarrior(photos: Photo[]): Achievement | null {
    if (photos.length === 0) return null;
    for (const photo of photos) {
        const day = photo.timestamp.getDay();
        if (day !== 0 && day !== 6) return null;
    }
    return createAchievement('weekend_warrior');
}

function checkLongWeekend(photos: Photo[]): Achievement | null {
    if (photos.length < 2) return null;
    const sorted = [...photos].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const days = (sorted[sorted.length - 1].timestamp.getTime() - sorted[0].timestamp.getTime()) / (1000 * 60 * 60 * 24);
    if (days >= 3 && days < 7) return createAchievement('long_weekend', { days: Math.ceil(days) });
    return null;
}

function checkWeekTraveler(photos: Photo[]): Achievement | null {
    if (photos.length < 2) return null;
    const sorted = [...photos].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const days = (sorted[sorted.length - 1].timestamp.getTime() - sorted[0].timestamp.getTime()) / (1000 * 60 * 60 * 24);
    if (days >= 7 && days < 30) return createAchievement('week_traveler', { days: Math.ceil(days) });
    return null;
}

function checkMonthAdventurer(photos: Photo[]): Achievement | null {
    if (photos.length < 2) return null;
    const sorted = [...photos].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const days = (sorted[sorted.length - 1].timestamp.getTime() - sorted[0].timestamp.getTime()) / (1000 * 60 * 60 * 24);
    if (days >= 30) return createAchievement('month_adventurer', { days: Math.ceil(days) });
    return null;
}

// ========== PHOTO BEHAVIOR ==========

function checkMachineGun(photos: Photo[]): Achievement | null {
    const sorted = [...photos].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    for (let i = 0; i < sorted.length - 10; i++) {
        if (sorted[i + 10].timestamp.getTime() - sorted[i].timestamp.getTime() <= 60000) {
            return createAchievement('machine_gun', { count: 11 });
        }
    }
    return null;
}

function checkTripleDigit(photos: Photo[]): Achievement | null {
    const sorted = [...photos].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    for (let i = 0; i < sorted.length - 2; i++) {
        if (sorted[i + 2].timestamp.getTime() - sorted[i].timestamp.getTime() <= 60000) {
            return createAchievement('triple_digit');
        }
    }
    return null;
}

function checkMinimalist(photos: Photo[]): Achievement | null {
    if (photos.length >= 5 && photos.length <= 10) {
        return createAchievement('minimalist', { count: photos.length });
    }
    return null;
}

function checkPhotographer(photos: Photo[]): Achievement | null {
    if (photos.length >= 100 && photos.length < 500) {
        return createAchievement('photographer', { count: photos.length });
    }
    return null;
}

function checkPaparazzi(photos: Photo[]): Achievement | null {
    if (photos.length >= 500) {
        return createAchievement('paparazzi', { count: photos.length });
    }
    return null;
}

function checkOneShot(photos: Photo[]): Achievement | null {
    if (photos.length === 1) {
        return createAchievement('one_shot');
    }
    return null;
}

function checkTimeLapseMaster(photos: Photo[]): Achievement | null {
    if (photos.length < 10) return null;
    const sorted = [...photos].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
        intervals.push(sorted[i].timestamp.getTime() - sorted[i - 1].timestamp.getTime());
    }
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev / avg < 0.3) {
        return createAchievement('time_lapse_master', { avgInterval: Math.round(avg / 1000) });
    }
    return null;
}

// ========== LOCATION & GEOGRAPHY ==========

function checkMountainHiker(photos: Photo[]): Achievement | null {
    const altPhotos = photos.filter((p) => p.altitude != null);
    if (altPhotos.length < 2) return null;
    let totalGain = 0;
    for (let i = 1; i < altPhotos.length; i++) {
        const diff = altPhotos[i].altitude! - altPhotos[i - 1].altitude!;
        if (diff > 0) totalGain += diff;
    }
    if (totalGain > 500) {
        return createAchievement('mountain_hiker', { elevationGain: Math.round(totalGain) });
    }
    return null;
}

function checkSeaLevel(photos: Photo[]): Achievement | null {
    const altPhotos = photos.filter((p) => p.altitude != null);
    if (altPhotos.length < 3) return null;
    for (const photo of altPhotos) {
        if (photo.altitude! > 10) return null;
    }
    return createAchievement('sea_level');
}

function checkAltitudeMaster(photos: Photo[]): Achievement | null {
    for (const photo of photos) {
        if (photo.altitude && photo.altitude > 2000) {
            return createAchievement('altitude_master', { altitude: photo.altitude });
        }
    }
    return null;
}

function checkCafeDweller(photos: Photo[]): Achievement | null {
    const gpsPhotos = photos.filter((p) => p.latitude != null && p.longitude != null);
    if (gpsPhotos.length < 2) return null;
    const clusters: Photo[][] = [];
    for (const photo of gpsPhotos) {
        let added = false;
        for (const cluster of clusters) {
            const dist = calculateDistance(cluster[0].latitude!, cluster[0].longitude!, photo.latitude!, photo.longitude!);
            if (dist <= 0.1) { cluster.push(photo); added = true; break; }
        }
        if (!added) clusters.push([photo]);
    }
    for (const cluster of clusters) {
        if (cluster.length < 2) continue;
        const sorted = cluster.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const span = sorted[sorted.length - 1].timestamp.getTime() - sorted[0].timestamp.getTime();
        if (span >= 3 * 60 * 60 * 1000) {
            return createAchievement('cafe_dweller', { hours: Math.round(span / (60 * 60 * 1000) * 10) / 10 });
        }
    }
    return null;
}

function checkNomad(photos: Photo[]): Achievement | null {
    const gpsPhotos = photos.filter((p) => p.latitude != null && p.longitude != null);
    if (gpsPhotos.length < 5) return null;
    const sorted = [...gpsPhotos].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    for (let i = 0; i < sorted.length - 1; i++) {
        const timeDiff = sorted[i + 1].timestamp.getTime() - sorted[i].timestamp.getTime();
        const dist = calculateDistance(sorted[i].latitude!, sorted[i].longitude!, sorted[i + 1].latitude!, sorted[i + 1].longitude!);
        if (timeDiff > 30 * 60 * 1000 && dist < 0.1) return null;
    }
    return createAchievement('nomad');
}

function checkBorderCrosser(photos: Photo[]): Achievement | null {
    const gpsPhotos = photos.filter((p) => p.latitude != null && p.longitude != null);
    for (let i = 1; i < gpsPhotos.length; i++) {
        const dist = calculateDistance(gpsPhotos[i - 1].latitude!, gpsPhotos[i - 1].longitude!, gpsPhotos[i].latitude!, gpsPhotos[i].longitude!);
        if (dist > 100) {
            return createAchievement('border_crosser', { distance: Math.round(dist) });
        }
    }
    return null;
}

function checkCircleBack(photos: Photo[]): Achievement | null {
    const gpsPhotos = photos.filter((p) => p.latitude != null && p.longitude != null);
    if (gpsPhotos.length < 3) return null;
    const sorted = [...gpsPhotos].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const dist = calculateDistance(first.latitude!, first.longitude!, last.latitude!, last.longitude!);
    if (dist < 0.1) {
        return createAchievement('circle_back');
    }
    return null;
}

function checkStraightLine(photos: Photo[]): Achievement | null {
    const gpsPhotos = photos.filter((p) => p.latitude != null && p.longitude != null);
    if (gpsPhotos.length < 5) return null;
    const sorted = [...gpsPhotos].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const directDist = calculateDistance(first.latitude!, first.longitude!, last.latitude!, last.longitude!);
    let totalDist = 0;
    for (let i = 1; i < sorted.length; i++) {
        totalDist += calculateDistance(sorted[i - 1].latitude!, sorted[i - 1].longitude!, sorted[i].latitude!, sorted[i].longitude!);
    }
    if (directDist > 10 && totalDist / directDist < 1.2) {
        return createAchievement('straight_line');
    }
    return null;
}

// ========== SPECIAL CONDITIONS ==========

function checkWeatherMaster(): Achievement | null {
    if (Math.random() > 0.7) return createAchievement('weather_master');
    return null;
}

function checkFirstTimer(isFirstTrip: boolean): Achievement | null {
    if (isFirstTrip) return createAchievement('first_timer');
    return null;
}

function checkLuckySeven(photos: Photo[]): Achievement | null {
    if (photos.length === 7) return createAchievement('lucky_seven');
    return null;
}

function checkRoundNumber(photos: Photo[]): Achievement | null {
    if ([10, 50, 100, 200, 500, 1000].includes(photos.length)) {
        return createAchievement('round_number', { count: photos.length });
    }
    return null;
}

function checkSymmetric(photos: Photo[]): Achievement | null {
    if (isPalindrome(photos.length)) {
        return createAchievement('symmetric', { count: photos.length });
    }
    return null;
}

function checkFibonacci(photos: Photo[]): Achievement | null {
    if (isFibonacci(photos.length)) {
        return createAchievement('fibonacci', { count: photos.length });
    }
    return null;
}

function checkPrimeTime(photos: Photo[]): Achievement | null {
    if (isPrime(photos.length) && photos.length > 10) {
        return createAchievement('prime_time', { count: photos.length });
    }
    return null;
}

function checkPerfectTiming(photos: Photo[]): Achievement | null {
    for (const photo of photos) {
        if (photo.timestamp.getSeconds() === 0 && photo.timestamp.getMilliseconds() < 1000) {
            return createAchievement('perfect_timing', { time: photo.timestamp.toISOString() });
        }
    }
    return null;
}

// Main function to calculate all achievements
export function calculateAchievements(photos: Photo[], isFirstTrip: boolean = false): Achievement[] {
    const achievements: Achievement[] = [];
    const totalDistance = calculateTotalDistance(generateRouteFromPhotos(photos));

    // Speed & Movement
    const teleporter = checkTeleporter(photos);
    if (teleporter) achievements.push(teleporter);
    const jetSetter = checkJetSetter(photos);
    if (jetSetter) achievements.push(jetSetter);
    const slowpoke = checkSlowpoke(photos);
    if (slowpoke) achievements.push(slowpoke);
    const marathonRunner = checkMarathonRunner(photos, totalDistance);
    if (marathonRunner) achievements.push(marathonRunner);

    // Time-based
    const earlyBird = checkEarlyBird(photos);
    if (earlyBird) achievements.push(earlyBird);
    const nightOwl = checkNightOwl(photos);
    if (nightOwl) achievements.push(nightOwl);
    const goldenHour = checkGoldenHour(photos);
    if (goldenHour) achievements.push(goldenHour);
    const midnightExplorer = checkMidnightExplorer(photos);
    if (midnightExplorer) achievements.push(midnightExplorer);
    const weekendWarrior = checkWeekendWarrior(photos);
    if (weekendWarrior) achievements.push(weekendWarrior);
    const longWeekend = checkLongWeekend(photos);
    if (longWeekend) achievements.push(longWeekend);
    const weekTraveler = checkWeekTraveler(photos);
    if (weekTraveler) achievements.push(weekTraveler);
    const monthAdventurer = checkMonthAdventurer(photos);
    if (monthAdventurer) achievements.push(monthAdventurer);

    // Photo behavior
    const machineGun = checkMachineGun(photos);
    if (machineGun) achievements.push(machineGun);
    const tripleDigit = checkTripleDigit(photos);
    if (tripleDigit) achievements.push(tripleDigit);
    const minimalist = checkMinimalist(photos);
    if (minimalist) achievements.push(minimalist);
    const photographer = checkPhotographer(photos);
    if (photographer) achievements.push(photographer);
    const paparazzi = checkPaparazzi(photos);
    if (paparazzi) achievements.push(paparazzi);
    const oneShot = checkOneShot(photos);
    if (oneShot) achievements.push(oneShot);
    const timeLapseMaster = checkTimeLapseMaster(photos);
    if (timeLapseMaster) achievements.push(timeLapseMaster);

    // Location & Geography
    const mountainHiker = checkMountainHiker(photos);
    if (mountainHiker) achievements.push(mountainHiker);
    const seaLevel = checkSeaLevel(photos);
    if (seaLevel) achievements.push(seaLevel);
    const altitudeMaster = checkAltitudeMaster(photos);
    if (altitudeMaster) achievements.push(altitudeMaster);
    const cafeDweller = checkCafeDweller(photos);
    if (cafeDweller) achievements.push(cafeDweller);
    const nomad = checkNomad(photos);
    if (nomad) achievements.push(nomad);
    const borderCrosser = checkBorderCrosser(photos);
    if (borderCrosser) achievements.push(borderCrosser);
    const circleBack = checkCircleBack(photos);
    if (circleBack) achievements.push(circleBack);
    const straightLine = checkStraightLine(photos);
    if (straightLine) achievements.push(straightLine);

    // Special conditions
    const weatherMaster = checkWeatherMaster();
    if (weatherMaster) achievements.push(weatherMaster);
    const firstTimer = checkFirstTimer(isFirstTrip);
    if (firstTimer) achievements.push(firstTimer);
    const luckySeven = checkLuckySeven(photos);
    if (luckySeven) achievements.push(luckySeven);
    const roundNumber = checkRoundNumber(photos);
    if (roundNumber) achievements.push(roundNumber);
    const symmetric = checkSymmetric(photos);
    if (symmetric) achievements.push(symmetric);
    const fibonacci = checkFibonacci(photos);
    if (fibonacci) achievements.push(fibonacci);
    const primeTime = checkPrimeTime(photos);
    if (primeTime) achievements.push(primeTime);
    const perfectTiming = checkPerfectTiming(photos);
    if (perfectTiming) achievements.push(perfectTiming);

    // Completionist check
    if (achievements.length >= 10) {
        achievements.push(createAchievement('completionist', { count: achievements.length }));
    }

    return achievements;
}

// Generate route points from photos
export function generateRouteFromPhotos(photos: Photo[]): RoutePoint[] {
    return photos
        .filter((p) => p.latitude != null && p.longitude != null)
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .map((p) => ({
            lat: p.latitude!,
            lng: p.longitude!,
            timestamp: p.timestamp,
            photoId: p.id,
        }));
}

// Calculate total distance from route
export function calculateTotalDistance(route: RoutePoint[]): number {
    let total = 0;
    for (let i = 1; i < route.length; i++) {
        total += calculateDistance(route[i - 1].lat, route[i - 1].lng, route[i].lat, route[i].lng);
    }
    return Math.round(total * 10) / 10;
}

// Calculate trip duration from photos
export function calculateDuration(photos: Photo[]): number {
    if (photos.length < 2) return 0;
    const sorted = [...photos].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    return Math.round((sorted[sorted.length - 1].timestamp.getTime() - sorted[0].timestamp.getTime()) / 1000);
}
