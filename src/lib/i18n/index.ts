import { ja } from './ja';

// Type-safe translation helper
type NestedKeyOf<T> = T extends object
    ? { [K in keyof T]: K extends string
        ? T[K] extends object
        ? `${K}.${NestedKeyOf<T[K]>}`
        : K
        : never
    }[keyof T]
    : never;

type TranslationPath = NestedKeyOf<typeof ja>;

// Get nested value from object by dot-notation path
function getNestedValue(obj: Record<string, unknown>, path: string): string {
    const keys = path.split('.');
    let result: unknown = obj;

    for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
            result = (result as Record<string, unknown>)[key];
        } else {
            return path; // Return path as fallback
        }
    }

    return typeof result === 'string' ? result : path;
}

// Translation function
export function t(path: string, params?: Record<string, string | number>): string {
    let text = getNestedValue(ja as unknown as Record<string, unknown>, path);

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
        });
    }

    return text;
}

// Format duration
export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0 && minutes > 0) {
        return t('time.hoursMinutes', { h: hours, m: minutes });
    } else if (hours > 0) {
        return t('time.hours', { h: hours });
    } else {
        return t('time.minutes', { m: minutes });
    }
}

// Format date in Japanese
export function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    }).format(date);
}

// Format date range
export function formatDateRange(start: Date, end: Date): string {
    const startStr = formatDate(start);
    if (start.getTime() === end.getTime()) {
        return startStr;
    }
    const endStr = formatDate(end);
    return `${startStr} 〜 ${endStr}`;
}

// Format datetime for photo
export function formatPhotoDateTime(date: Date): string {
    return new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

export { ja };
