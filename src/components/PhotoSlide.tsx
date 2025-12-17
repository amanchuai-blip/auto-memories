'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import type { Photo } from '@/types';

interface PhotoSlideProps {
    photos: Photo[];
    currentIndex: number;
    displayDurationMs?: number;
    onPhotoChange?: (index: number) => void;
    className?: string;
}

export default function PhotoSlide({
    photos,
    currentIndex,
    className = '',
}: PhotoSlideProps) {
    const [imageUrls, setImageUrls] = useState<Map<string, string>>(new Map());

    // Create object URLs for photos
    useEffect(() => {
        const urls = new Map<string, string>();

        photos.forEach((photo) => {
            const url = URL.createObjectURL(photo.blob);
            urls.set(photo.id, url);
        });

        setImageUrls(urls);

        // Cleanup URLs on unmount
        return () => {
            urls.forEach((url) => URL.revokeObjectURL(url));
        };
    }, [photos]);

    const currentPhoto = photos[currentIndex];
    const currentUrl = currentPhoto ? imageUrls.get(currentPhoto.id) : null;

    // Format date for display
    const formattedDate = useMemo(() => {
        if (!currentPhoto) return '';
        const date = currentPhoto.timestamp;
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    }, [currentPhoto]);

    if (!currentPhoto || !currentUrl) {
        return null;
    }

    return (
        <div className={`relative overflow-hidden ${className}`}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentPhoto.id}
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.8, ease: 'easeInOut' }}
                    className="relative w-full h-full"
                >
                    {/* Photo */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black">
                        <Image
                            src={currentUrl}
                            alt={currentPhoto.filename}
                            fill
                            className="object-contain"
                            sizes="100vw"
                            priority
                        />
                    </div>

                    {/* Vignette effect */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-radial from-transparent via-transparent to-black/50" />

                    {/* Photo info overlay */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent"
                    >
                        <p className="text-white/90 text-lg font-light">{formattedDate}</p>
                        {currentPhoto.latitude && currentPhoto.longitude && (
                            <p className="text-white/60 text-sm mt-1">
                                {currentPhoto.latitude.toFixed(4)}°, {currentPhoto.longitude.toFixed(4)}°
                            </p>
                        )}
                    </motion.div>

                    {/* Progress indicator */}
                    <div className="absolute top-4 left-4 right-4 flex gap-1">
                        {photos.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-0.5 flex-1 rounded-full transition-colors ${idx <= currentIndex ? 'bg-white' : 'bg-white/30'
                                    }`}
                            />
                        ))}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
