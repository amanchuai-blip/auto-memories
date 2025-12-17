// Type definitions for Auto Memories PWA

export type AchievementType =
    // Speed & Movement
    | 'teleporter'        // Speed > 150km/h
    | 'slowpoke'          // Max speed < 5km/h for entire trip
    | 'marathon_runner'   // Total distance > 42km on foot pace
    | 'jet_setter'        // Speed > 500km/h (airplane)

    // Time-based
    | 'early_bird'        // Photo 05:00-07:00
    | 'night_owl'         // Photo 02:00-04:00
    | 'golden_hour'       // Photo at sunset/sunrise (magic hour)
    | 'midnight_explorer' // Photo at exactly midnight ±5min
    | 'weekend_warrior'   // Trip only on Sat/Sun
    | 'long_weekend'      // Trip spans 3+ consecutive days
    | 'week_traveler'     // Trip spans 7+ days
    | 'month_adventurer'  // Trip spans 30+ days

    // Photo behavior
    | 'machine_gun'       // >10 photos in 1 minute
    | 'minimalist'        // Trip with only 5-10 photos
    | 'photographer'      // 100+ photos in trip
    | 'paparazzi'         // 500+ photos in trip
    | 'one_shot'          // Only 1 photo in trip
    | 'time_lapse_master' // Photos at regular intervals

    // Location & Geography
    | 'mountain_hiker'    // Elevation gain > 500m
    | 'sea_level'         // All photos at altitude < 10m
    | 'altitude_master'   // Photo at > 2000m altitude
    | 'cafe_dweller'      // Stay in 100m radius for 3+ hours
    | 'nomad'             // Never stayed in same spot > 30min
    | 'border_crosser'    // Large GPS coordinate jump (different region)
    | 'circle_back'       // Start and end within 100m
    | 'straight_line'     // Route forms nearly straight path

    // Special conditions
    | 'weather_master'    // Mock: varied weather
    | 'completionist'     // 10+ achievements in one trip
    | 'first_timer'       // Very first trip created
    | 'anniversary'       // Trip on same date as previous trip
    | 'lucky_seven'       // Exactly 7 photos
    | 'round_number'      // Exactly 10, 50, or 100 photos
    | 'symmetric'         // Photo count is palindrome (11, 22, 33...)
    | 'fibonacci'         // Photo count is fibonacci number
    | 'prime_time'        // Photo count is prime number
    | 'perfect_timing'    // Photo taken at :00:00 seconds
    | 'triple_digit'      // 3 consecutive photos within same minute

export interface Achievement {
    id: string;
    type: AchievementType;
    unlockedAt: Date;
    metadata?: Record<string, unknown>;
}

export interface Photo {
    id: string;
    tripId: string;
    blob: Blob;
    thumbnailBlob?: Blob;
    filename: string;
    timestamp: Date;
    latitude?: number;
    longitude?: number;
    altitude?: number;
    width?: number;
    height?: number;
}

export interface RoutePoint {
    lat: number;
    lng: number;
    timestamp: Date;
    photoId?: string;
}

export interface Trip {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    startDate?: Date;
    endDate?: Date;
    route: RoutePoint[];
    achievements: Achievement[];
    totalPhotos: number;
    totalDistance: number; // km
    duration: number; // seconds
    coverPhotoId?: string;
}

export interface ProcessedImage {
    id: string;
    blob: Blob;
    thumbnailBlob: Blob;
    filename: string;
    timestamp: Date | null;
    latitude: number | null;
    longitude: number | null;
    altitude: number | null;
    width: number;
    height: number;
}

export interface ImageProcessingProgress {
    current: number;
    total: number;
    filename: string;
    status: 'processing' | 'done' | 'error';
    error?: string;
}

export interface EndRollConfig {
    scrollSpeedMs: number;
    photoDisplayMs: number;
    mapAnimationMs: number;
    showAchievements: boolean;
    playAudio: boolean;
}

export interface AchievementDefinition {
    type: AchievementType;
    icon: string;
    title: string;
    description: string;
    color: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

export const ACHIEVEMENT_DEFINITIONS: Record<AchievementType, AchievementDefinition> = {
    // Speed & Movement
    teleporter: {
        type: 'teleporter',
        icon: '🚄',
        title: 'Teleporter',
        description: 'Warped through space at incredible speed',
        color: '#8B5CF6',
        rarity: 'uncommon',
    },
    slowpoke: {
        type: 'slowpoke',
        icon: '🐢',
        title: 'Slowpoke',
        description: 'Took your sweet time',
        color: '#84CC16',
        rarity: 'rare',
    },
    marathon_runner: {
        type: 'marathon_runner',
        icon: '🏃',
        title: 'Marathon Runner',
        description: 'Traveled marathon distance on foot',
        color: '#EF4444',
        rarity: 'epic',
    },
    jet_setter: {
        type: 'jet_setter',
        icon: '✈️',
        title: 'Jet Setter',
        description: 'Flew through the skies',
        color: '#0EA5E9',
        rarity: 'rare',
    },

    // Time-based
    early_bird: {
        type: 'early_bird',
        icon: '🌅',
        title: 'Early Bird',
        description: 'Caught the morning light',
        color: '#F59E0B',
        rarity: 'common',
    },
    night_owl: {
        type: 'night_owl',
        icon: '🦉',
        title: 'Night Owl',
        description: 'Explored the midnight hours',
        color: '#3B82F6',
        rarity: 'uncommon',
    },
    golden_hour: {
        type: 'golden_hour',
        icon: '🌇',
        title: 'Golden Hour',
        description: 'Captured the magic light',
        color: '#F97316',
        rarity: 'common',
    },
    midnight_explorer: {
        type: 'midnight_explorer',
        icon: '🌙',
        title: 'Midnight Explorer',
        description: 'Active at the witching hour',
        color: '#1E3A8A',
        rarity: 'rare',
    },
    weekend_warrior: {
        type: 'weekend_warrior',
        icon: '🎉',
        title: 'Weekend Warrior',
        description: 'Made the most of days off',
        color: '#A855F7',
        rarity: 'common',
    },
    long_weekend: {
        type: 'long_weekend',
        icon: '🏕️',
        title: 'Long Weekend',
        description: 'Extended the adventure',
        color: '#22C55E',
        rarity: 'uncommon',
    },
    week_traveler: {
        type: 'week_traveler',
        icon: '🗺️',
        title: 'Week Traveler',
        description: 'A full week of exploration',
        color: '#06B6D4',
        rarity: 'rare',
    },
    month_adventurer: {
        type: 'month_adventurer',
        icon: '🌍',
        title: 'Month Adventurer',
        description: 'A month-long odyssey',
        color: '#DC2626',
        rarity: 'legendary',
    },

    // Photo behavior
    machine_gun: {
        type: 'machine_gun',
        icon: '📸',
        title: 'Machine Gun',
        description: 'Rapid-fire photography',
        color: '#EF4444',
        rarity: 'uncommon',
    },
    minimalist: {
        type: 'minimalist',
        icon: '🎯',
        title: 'Minimalist',
        description: 'Quality over quantity',
        color: '#64748B',
        rarity: 'uncommon',
    },
    photographer: {
        type: 'photographer',
        icon: '📷',
        title: 'Photographer',
        description: 'Captured 100+ moments',
        color: '#EC4899',
        rarity: 'rare',
    },
    paparazzi: {
        type: 'paparazzi',
        icon: '🎬',
        title: 'Paparazzi',
        description: 'Documented everything',
        color: '#F43F5E',
        rarity: 'epic',
    },
    one_shot: {
        type: 'one_shot',
        icon: '🎲',
        title: 'One Shot',
        description: 'One photo, one memory',
        color: '#9333EA',
        rarity: 'legendary',
    },
    time_lapse_master: {
        type: 'time_lapse_master',
        icon: '⏱️',
        title: 'Time Lapse Master',
        description: 'Perfectly timed intervals',
        color: '#14B8A6',
        rarity: 'epic',
    },

    // Location & Geography
    mountain_hiker: {
        type: 'mountain_hiker',
        icon: '⛰️',
        title: 'Mountain Hiker',
        description: 'Conquered great heights',
        color: '#10B981',
        rarity: 'uncommon',
    },
    sea_level: {
        type: 'sea_level',
        icon: '🏖️',
        title: 'Beach Lover',
        description: 'Stayed close to the sea',
        color: '#38BDF8',
        rarity: 'common',
    },
    altitude_master: {
        type: 'altitude_master',
        icon: '🏔️',
        title: 'Altitude Master',
        description: 'Reached the heavens',
        color: '#7C3AED',
        rarity: 'epic',
    },
    cafe_dweller: {
        type: 'cafe_dweller',
        icon: '☕',
        title: 'Cafe Dweller',
        description: 'Found the perfect spot',
        color: '#6366F1',
        rarity: 'uncommon',
    },
    nomad: {
        type: 'nomad',
        icon: '🏃‍♂️',
        title: 'Nomad',
        description: 'Never stopped moving',
        color: '#F59E0B',
        rarity: 'rare',
    },
    border_crosser: {
        type: 'border_crosser',
        icon: '🛂',
        title: 'Border Crosser',
        description: 'Ventured to new territories',
        color: '#059669',
        rarity: 'rare',
    },
    circle_back: {
        type: 'circle_back',
        icon: '🔄',
        title: 'Circle Back',
        description: 'Returned to where it began',
        color: '#8B5CF6',
        rarity: 'common',
    },
    straight_line: {
        type: 'straight_line',
        icon: '📏',
        title: 'Straight Line',
        description: 'Traveled with purpose',
        color: '#475569',
        rarity: 'rare',
    },

    // Special conditions
    weather_master: {
        type: 'weather_master',
        icon: '🌤️',
        title: 'Weather Master',
        description: 'Experienced all conditions',
        color: '#14B8A6',
        rarity: 'rare',
    },
    completionist: {
        type: 'completionist',
        icon: '🏆',
        title: 'Completionist',
        description: 'Achievement hunter',
        color: '#EAB308',
        rarity: 'legendary',
    },
    first_timer: {
        type: 'first_timer',
        icon: '🎊',
        title: 'First Timer',
        description: 'Welcome to Auto Memories',
        color: '#EC4899',
        rarity: 'common',
    },
    anniversary: {
        type: 'anniversary',
        icon: '🎂',
        title: 'Anniversary',
        description: 'A special date returns',
        color: '#F43F5E',
        rarity: 'epic',
    },
    lucky_seven: {
        type: 'lucky_seven',
        icon: '🎰',
        title: 'Lucky Seven',
        description: 'The magic number',
        color: '#22C55E',
        rarity: 'uncommon',
    },
    round_number: {
        type: 'round_number',
        icon: '💯',
        title: 'Round Number',
        description: 'Perfectly balanced',
        color: '#3B82F6',
        rarity: 'uncommon',
    },
    symmetric: {
        type: 'symmetric',
        icon: '🪞',
        title: 'Symmetric',
        description: 'Mirror mirror...',
        color: '#A855F7',
        rarity: 'rare',
    },
    fibonacci: {
        type: 'fibonacci',
        icon: '🐚',
        title: 'Fibonacci',
        description: 'Nature\'s sequence',
        color: '#84CC16',
        rarity: 'epic',
    },
    prime_time: {
        type: 'prime_time',
        icon: '🔢',
        title: 'Prime Time',
        description: 'Mathematically special',
        color: '#6366F1',
        rarity: 'rare',
    },
    perfect_timing: {
        type: 'perfect_timing',
        icon: '⏰',
        title: 'Perfect Timing',
        description: 'Captured at exactly :00',
        color: '#F97316',
        rarity: 'rare',
    },
    triple_digit: {
        type: 'triple_digit',
        icon: '🔥',
        title: 'Triple Digit',
        description: 'Burst mode activated',
        color: '#DC2626',
        rarity: 'uncommon',
    },
};
