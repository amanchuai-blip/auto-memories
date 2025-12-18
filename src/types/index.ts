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
    | 'morning_person'    // Most photos before noon
    | 'afternoon_chill'   // Most photos 12:00-18:00
    | 'night_shooter'     // Most photos after 18:00

    // Photo behavior
    | 'machine_gun'       // >10 photos in 1 minute
    | 'minimalist'        // Trip with only 5-10 photos
    | 'photographer'      // 100+ photos in trip
    | 'paparazzi'         // 500+ photos in trip
    | 'one_shot'          // Only 1 photo in trip
    | 'time_lapse_master' // Photos at regular intervals
    | 'duo'               // Exactly 2 photos
    | 'trio'              // Exactly 3 photos
    | 'handful'           // Exactly 5 photos
    | 'dozen'             // 12 photos
    | 'twenty'            // 20 photos
    | 'thirty'            // 30 photos
    | 'fifty'             // 50 photos

    // Location & Geography
    | 'mountain_hiker'    // Elevation gain > 500m
    | 'sea_level'         // All photos at altitude < 10m
    | 'altitude_master'   // Photo at > 2000m altitude
    | 'cafe_dweller'      // Stay in 100m radius for 3+ hours
    | 'nomad'             // Never stayed in same spot > 30min
    | 'border_crosser'    // Large GPS coordinate jump (different region)
    | 'circle_back'       // Start and end within 100m
    | 'straight_line'     // Route forms nearly straight path
    | 'short_trip'        // Total distance < 1km
    | 'medium_trip'       // Total distance 1-10km
    | 'long_trip'         // Total distance 10-50km
    | 'ultra_trip'        // Total distance > 50km

    // Day of week
    | 'monday_blues'      // Trip on Monday
    | 'tuesday_vibes'     // Trip on Tuesday
    | 'hump_day'          // Trip on Wednesday
    | 'thursday_mood'     // Trip on Thursday
    | 'friday_feeling'    // Trip on Friday
    | 'saturday_fun'      // Trip on Saturday
    | 'sunday_chill'      // Trip on Sunday

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
    | 'quick_snap'        // Trip under 10 minutes
    | 'hour_journey'      // Trip 1-2 hours
    | 'half_day'          // Trip 3-6 hours
    | 'full_day'          // Trip 6-12 hours
    | 'multi_day'         // Trip > 24 hours

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
        title: '高速移動',
        description: '超高速で移動した',
        color: '#8B5CF6',
        rarity: 'uncommon',
    },
    slowpoke: {
        type: 'slowpoke',
        icon: '🐢',
        title: 'のんびり屋',
        description: 'ゆっくり楽しんだ',
        color: '#84CC16',
        rarity: 'rare',
    },
    marathon_runner: {
        type: 'marathon_runner',
        icon: '🏃',
        title: 'マラソンランナー',
        description: '42km以上移動',
        color: '#EF4444',
        rarity: 'epic',
    },
    jet_setter: {
        type: 'jet_setter',
        icon: '✈️',
        title: '空の旅人',
        description: '飛行機で移動',
        color: '#0EA5E9',
        rarity: 'rare',
    },

    // Time-based
    early_bird: {
        type: 'early_bird',
        icon: '🌅',
        title: '早起き',
        description: '朝5-7時に撮影',
        color: '#F59E0B',
        rarity: 'common',
    },
    night_owl: {
        type: 'night_owl',
        icon: '🦉',
        title: '夜ふかし',
        description: '深夜2-4時に撮影',
        color: '#3B82F6',
        rarity: 'uncommon',
    },
    golden_hour: {
        type: 'golden_hour',
        icon: '🌇',
        title: 'ゴールデンアワー',
        description: '夕暮れ時に撮影',
        color: '#F97316',
        rarity: 'common',
    },
    midnight_explorer: {
        type: 'midnight_explorer',
        icon: '🌙',
        title: '真夜中の探検家',
        description: '0時前後に撮影',
        color: '#1E3A8A',
        rarity: 'rare',
    },
    weekend_warrior: {
        type: 'weekend_warrior',
        icon: '🎉',
        title: '週末の戦士',
        description: '週末だけの旅',
        color: '#A855F7',
        rarity: 'common',
    },
    long_weekend: {
        type: 'long_weekend',
        icon: '🏕️',
        title: '連休満喫',
        description: '3日以上の旅',
        color: '#22C55E',
        rarity: 'uncommon',
    },
    week_traveler: {
        type: 'week_traveler',
        icon: '🗺️',
        title: '1週間の旅人',
        description: '7日以上の旅',
        color: '#06B6D4',
        rarity: 'rare',
    },
    month_adventurer: {
        type: 'month_adventurer',
        icon: '🌍',
        title: '1ヶ月の冒険家',
        description: '30日以上の大冒険',
        color: '#DC2626',
        rarity: 'legendary',
    },
    morning_person: {
        type: 'morning_person',
        icon: '☀️',
        title: '朝型人間',
        description: '午前中メイン',
        color: '#FBBF24',
        rarity: 'common',
    },
    afternoon_chill: {
        type: 'afternoon_chill',
        icon: '🌤️',
        title: '午後のんびり',
        description: '午後メインの撮影',
        color: '#F97316',
        rarity: 'common',
    },
    night_shooter: {
        type: 'night_shooter',
        icon: '🌃',
        title: '夜の撮影者',
        description: '夜メインの撮影',
        color: '#6366F1',
        rarity: 'common',
    },

    // Photo behavior
    machine_gun: {
        type: 'machine_gun',
        icon: '📸',
        title: '連写マスター',
        description: '1分に10枚以上',
        color: '#EF4444',
        rarity: 'uncommon',
    },
    minimalist: {
        type: 'minimalist',
        icon: '🎯',
        title: 'ミニマリスト',
        description: '5-10枚だけ',
        color: '#64748B',
        rarity: 'uncommon',
    },
    photographer: {
        type: 'photographer',
        icon: '📷',
        title: 'フォトグラファー',
        description: '100枚以上撮影',
        color: '#EC4899',
        rarity: 'rare',
    },
    paparazzi: {
        type: 'paparazzi',
        icon: '🎬',
        title: 'パパラッチ',
        description: '500枚以上撮影',
        color: '#F43F5E',
        rarity: 'epic',
    },
    one_shot: {
        type: 'one_shot',
        icon: '🎲',
        title: 'ワンショット',
        description: '1枚だけの記録',
        color: '#9333EA',
        rarity: 'legendary',
    },
    time_lapse_master: {
        type: 'time_lapse_master',
        icon: '⏱️',
        title: 'タイムラプス',
        description: '定期的な撮影',
        color: '#14B8A6',
        rarity: 'epic',
    },
    duo: {
        type: 'duo',
        icon: '✌️',
        title: 'デュオ',
        description: '2枚の思い出',
        color: '#8B5CF6',
        rarity: 'common',
    },
    trio: {
        type: 'trio',
        icon: '🔺',
        title: 'トリオ',
        description: '3枚の瞬間',
        color: '#EC4899',
        rarity: 'common',
    },
    handful: {
        type: 'handful',
        icon: '🖐️',
        title: 'ひとつかみ',
        description: '5枚ぴったり',
        color: '#F59E0B',
        rarity: 'common',
    },
    dozen: {
        type: 'dozen',
        icon: '🎁',
        title: 'ダズン',
        description: '12枚の記録',
        color: '#10B981',
        rarity: 'common',
    },
    twenty: {
        type: 'twenty',
        icon: '🎯',
        title: 'トゥエンティ',
        description: '20枚達成',
        color: '#3B82F6',
        rarity: 'common',
    },
    thirty: {
        type: 'thirty',
        icon: '📚',
        title: 'サーティ',
        description: '30枚の物語',
        color: '#8B5CF6',
        rarity: 'common',
    },
    fifty: {
        type: 'fifty',
        icon: '🏆',
        title: 'フィフティ',
        description: '50枚の冒険',
        color: '#EAB308',
        rarity: 'uncommon',
    },

    // Location & Geography
    mountain_hiker: {
        type: 'mountain_hiker',
        icon: '⛰️',
        title: '山登り',
        description: '標高差500m以上',
        color: '#10B981',
        rarity: 'uncommon',
    },
    sea_level: {
        type: 'sea_level',
        icon: '🏖️',
        title: 'ビーチラバー',
        description: '海沿いの旅',
        color: '#38BDF8',
        rarity: 'common',
    },
    altitude_master: {
        type: 'altitude_master',
        icon: '🏔️',
        title: '標高マスター',
        description: '2000m以上',
        color: '#7C3AED',
        rarity: 'epic',
    },
    cafe_dweller: {
        type: 'cafe_dweller',
        icon: '☕',
        title: 'カフェ好き',
        description: '3時間以上滞在',
        color: '#6366F1',
        rarity: 'uncommon',
    },
    nomad: {
        type: 'nomad',
        icon: '🏃‍♂️',
        title: 'ノマド',
        description: '止まらない旅',
        color: '#F59E0B',
        rarity: 'rare',
    },
    border_crosser: {
        type: 'border_crosser',
        icon: '🛂',
        title: '越境者',
        description: '遠くへジャンプ',
        color: '#059669',
        rarity: 'rare',
    },
    circle_back: {
        type: 'circle_back',
        icon: '🔄',
        title: '帰ってきた',
        description: '出発点に戻る',
        color: '#8B5CF6',
        rarity: 'common',
    },
    straight_line: {
        type: 'straight_line',
        icon: '📏',
        title: '一直線',
        description: 'まっすぐ進んだ',
        color: '#475569',
        rarity: 'rare',
    },
    short_trip: {
        type: 'short_trip',
        icon: '🚶',
        title: 'ショートトリップ',
        description: '1km未満の散歩',
        color: '#84CC16',
        rarity: 'common',
    },
    medium_trip: {
        type: 'medium_trip',
        icon: '🚴',
        title: 'ミドルトリップ',
        description: '1-10kmの旅',
        color: '#22C55E',
        rarity: 'common',
    },
    long_trip: {
        type: 'long_trip',
        icon: '🚗',
        title: 'ロングトリップ',
        description: '10-50kmの旅',
        color: '#0EA5E9',
        rarity: 'common',
    },
    ultra_trip: {
        type: 'ultra_trip',
        icon: '🛫',
        title: 'ウルトラトリップ',
        description: '50km以上の大移動',
        color: '#8B5CF6',
        rarity: 'uncommon',
    },

    // Day of week
    monday_blues: {
        type: 'monday_blues',
        icon: '😴',
        title: '月曜日',
        description: '週の始まりに撮影',
        color: '#3B82F6',
        rarity: 'common',
    },
    tuesday_vibes: {
        type: 'tuesday_vibes',
        icon: '✨',
        title: '火曜日',
        description: '火曜日の記録',
        color: '#EF4444',
        rarity: 'common',
    },
    hump_day: {
        type: 'hump_day',
        icon: '🐫',
        title: '水曜日',
        description: '週の真ん中',
        color: '#14B8A6',
        rarity: 'common',
    },
    thursday_mood: {
        type: 'thursday_mood',
        icon: '⚡',
        title: '木曜日',
        description: '木曜日の思い出',
        color: '#F59E0B',
        rarity: 'common',
    },
    friday_feeling: {
        type: 'friday_feeling',
        icon: '🎉',
        title: '金曜日',
        description: '週末前の撮影',
        color: '#EC4899',
        rarity: 'common',
    },
    saturday_fun: {
        type: 'saturday_fun',
        icon: '🌈',
        title: '土曜日',
        description: '休日を満喫',
        color: '#8B5CF6',
        rarity: 'common',
    },
    sunday_chill: {
        type: 'sunday_chill',
        icon: '☕',
        title: '日曜日',
        description: 'のんびり日曜',
        color: '#F97316',
        rarity: 'common',
    },

    // Special conditions
    weather_master: {
        type: 'weather_master',
        icon: '🌤️',
        title: '天気マスター',
        description: '色々な天気',
        color: '#14B8A6',
        rarity: 'rare',
    },
    completionist: {
        type: 'completionist',
        icon: '🏆',
        title: 'コンプリート',
        description: '10個以上の実績',
        color: '#EAB308',
        rarity: 'legendary',
    },
    first_timer: {
        type: 'first_timer',
        icon: '🎊',
        title: '初めての記録',
        description: 'ようこそ！',
        color: '#EC4899',
        rarity: 'common',
    },
    anniversary: {
        type: 'anniversary',
        icon: '🎂',
        title: '記念日',
        description: '特別な日の記録',
        color: '#F43F5E',
        rarity: 'epic',
    },
    lucky_seven: {
        type: 'lucky_seven',
        icon: '🎰',
        title: 'ラッキー7',
        description: '7枚の幸運',
        color: '#22C55E',
        rarity: 'uncommon',
    },
    round_number: {
        type: 'round_number',
        icon: '💯',
        title: 'キリ番',
        description: '10,50,100枚',
        color: '#3B82F6',
        rarity: 'uncommon',
    },
    symmetric: {
        type: 'symmetric',
        icon: '🪞',
        title: 'ゾロ目',
        description: '11,22,33...',
        color: '#A855F7',
        rarity: 'rare',
    },
    fibonacci: {
        type: 'fibonacci',
        icon: '🐚',
        title: 'フィボナッチ',
        description: '自然の数列',
        color: '#84CC16',
        rarity: 'epic',
    },
    prime_time: {
        type: 'prime_time',
        icon: '🔢',
        title: '素数',
        description: '特別な数字',
        color: '#6366F1',
        rarity: 'rare',
    },
    perfect_timing: {
        type: 'perfect_timing',
        icon: '⏰',
        title: 'ジャスト',
        description: ':00秒に撮影',
        color: '#F97316',
        rarity: 'rare',
    },
    triple_digit: {
        type: 'triple_digit',
        icon: '🔥',
        title: '連続撮影',
        description: '1分に3枚以上',
        color: '#DC2626',
        rarity: 'uncommon',
    },
    quick_snap: {
        type: 'quick_snap',
        icon: '⚡',
        title: 'クイックスナップ',
        description: '10分以内の記録',
        color: '#FBBF24',
        rarity: 'common',
    },
    hour_journey: {
        type: 'hour_journey',
        icon: '⏱️',
        title: '1時間の旅',
        description: '1-2時間の記録',
        color: '#22C55E',
        rarity: 'common',
    },
    half_day: {
        type: 'half_day',
        icon: '🌤️',
        title: '半日の冒険',
        description: '3-6時間の記録',
        color: '#0EA5E9',
        rarity: 'common',
    },
    full_day: {
        type: 'full_day',
        icon: '🌞',
        title: '1日の記録',
        description: '6-12時間の思い出',
        color: '#F59E0B',
        rarity: 'common',
    },
    multi_day: {
        type: 'multi_day',
        icon: '📅',
        title: '複数日の旅',
        description: '24時間以上の大冒険',
        color: '#8B5CF6',
        rarity: 'uncommon',
    },
};
