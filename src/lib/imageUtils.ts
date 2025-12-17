import type { ProcessedImage } from '@/types';
import * as exifr from 'exifr';

// Check if file is HEIC format
export function isHeicFile(file: File): boolean {
    const name = file.name.toLowerCase();
    return name.endsWith('.heic') || name.endsWith('.heif');
}

// Convert HEIC to JPEG (dynamic import to avoid SSR issues)
export async function convertHeicToJpeg(file: File): Promise<Blob> {
    try {
        const heic2any = (await import('heic2any')).default;
        const result = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.9,
        });
        return Array.isArray(result) ? result[0] : result;
    } catch (error) {
        console.error('HEIC conversion failed:', error);
        throw new Error(`Failed to convert HEIC file: ${file.name}`);
    }
}

// Extract EXIF metadata from image
export async function extractExifData(blob: Blob): Promise<{
    timestamp: Date | null;
    latitude: number | null;
    longitude: number | null;
    altitude: number | null;
}> {
    try {
        const exif = await exifr.parse(blob, {
            pick: ['DateTimeOriginal', 'CreateDate', 'GPSLatitude', 'GPSLongitude', 'GPSAltitude'],
        });

        if (!exif) {
            return { timestamp: null, latitude: null, longitude: null, altitude: null };
        }

        // Parse timestamp
        let timestamp: Date | null = null;
        if (exif.DateTimeOriginal) {
            timestamp = new Date(exif.DateTimeOriginal);
        } else if (exif.CreateDate) {
            timestamp = new Date(exif.CreateDate);
        }

        // Parse GPS coordinates (exifr already converts to decimal degrees)
        const latitude = exif.GPSLatitude ?? null;
        const longitude = exif.GPSLongitude ?? null;
        const altitude = exif.GPSAltitude ?? null;

        return { timestamp, latitude, longitude, altitude };
    } catch (error) {
        console.error('EXIF extraction failed:', error);
        return { timestamp: null, latitude: null, longitude: null, altitude: null };
    }
}

// Create thumbnail from image blob
export async function createThumbnail(blob: Blob, maxSize: number = 300): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);

        img.onload = () => {
            URL.revokeObjectURL(url);

            const canvas = document.createElement('canvas');
            let { width, height } = img;

            // Calculate new dimensions
            if (width > height) {
                if (width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                }
            } else {
                if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (thumbnailBlob) => {
                    if (thumbnailBlob) {
                        resolve(thumbnailBlob);
                    } else {
                        reject(new Error('Failed to create thumbnail'));
                    }
                },
                'image/jpeg',
                0.8
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}

// Get image dimensions
export async function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);

        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve({ width: img.width, height: img.height });
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}

// Process a single image file
export async function processImage(file: File): Promise<ProcessedImage> {
    // Convert HEIC if needed
    let blob: Blob = file;
    if (isHeicFile(file)) {
        blob = await convertHeicToJpeg(file);
    }

    // Extract EXIF data
    const exif = await extractExifData(blob);

    // Get dimensions
    const dimensions = await getImageDimensions(blob);

    // Create thumbnail
    const thumbnailBlob = await createThumbnail(blob);

    return {
        id: crypto.randomUUID(),
        blob,
        thumbnailBlob,
        filename: file.name,
        timestamp: exif.timestamp,
        latitude: exif.latitude,
        longitude: exif.longitude,
        altitude: exif.altitude,
        width: dimensions.width,
        height: dimensions.height,
    };
}

// Process multiple images with progress callback
export async function processImages(
    files: File[],
    onProgress?: (current: number, total: number, filename: string) => void
): Promise<ProcessedImage[]> {
    const results: ProcessedImage[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        onProgress?.(i + 1, files.length, file.name);

        try {
            const processed = await processImage(file);
            results.push(processed);
        } catch (error) {
            console.error(`Failed to process ${file.name}:`, error);
            // Continue processing other files
        }
    }

    return results;
}
