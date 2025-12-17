'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, AlertCircle } from 'lucide-react';
import PhotoDropzone from '@/components/PhotoDropzone';
import { processImages } from '@/lib/imageUtils';
import { calculateAchievements, generateRouteFromPhotos, calculateTotalDistance, calculateDuration } from '@/lib/achievements';
import { createTrip, addPhotosToTrip, getAllTrips } from '@/lib/db';
import { t, formatDate } from '@/lib/i18n';
import type { Photo, Trip } from '@/types';

export default function CreatePage() {
    const router = useRouter();
    const [tripName, setTripName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0, filename: '' });
    const [error, setError] = useState<string | null>(null);
    const [processedPhotos, setProcessedPhotos] = useState<Photo[]>([]);

    const handleFilesSelected = useCallback(async (files: File[]) => {
        setError(null);
        setIsProcessing(true);

        try {
            const processed = await processImages(files, (current, total, filename) => {
                setProcessingProgress({ current, total, filename });
            });

            if (processed.length === 0) {
                setError(t('create.errors.noPhotos'));
                setIsProcessing(false);
                return;
            }

            const validPhotos = processed.filter((p) => p.timestamp !== null);

            if (validPhotos.length === 0) {
                setError(t('create.errors.noExif'));
                setIsProcessing(false);
                return;
            }

            const photos: Photo[] = validPhotos.map((p) => ({
                id: p.id,
                tripId: '',
                blob: p.blob,
                thumbnailBlob: p.thumbnailBlob,
                filename: p.filename,
                timestamp: p.timestamp!,
                latitude: p.latitude ?? undefined,
                longitude: p.longitude ?? undefined,
                altitude: p.altitude ?? undefined,
                width: p.width,
                height: p.height,
            }));

            setProcessedPhotos(photos);

            if (!tripName) {
                const sorted = [...photos].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
                const startDate = sorted[0].timestamp;
                const month = startDate.toLocaleDateString('ja-JP', { month: 'long' });
                setTripName(`${month}の旅`);
            }
        } catch (err) {
            console.error('Processing error:', err);
            setError(t('create.errors.noPhotos'));
        } finally {
            setIsProcessing(false);
        }
    }, [tripName]);

    const handleCreateTrip = async () => {
        if (processedPhotos.length === 0 || !tripName.trim()) return;

        setIsProcessing(true);
        setError(null);

        try {
            // Check if this is the first trip
            const existingTrips = await getAllTrips();
            const isFirstTrip = existingTrips.length === 0;

            const route = generateRouteFromPhotos(processedPhotos);
            const achievements = calculateAchievements(processedPhotos, isFirstTrip);
            const totalDistance = calculateTotalDistance(route);
            const duration = calculateDuration(processedPhotos);

            const sorted = [...processedPhotos].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            const startDate = sorted[0].timestamp;
            const endDate = sorted[sorted.length - 1].timestamp;

            const tripId = crypto.randomUUID();
            const trip: Trip = {
                id: tripId,
                name: tripName.trim(),
                createdAt: new Date(),
                updatedAt: new Date(),
                startDate,
                endDate,
                route,
                achievements,
                totalPhotos: processedPhotos.length,
                totalDistance,
                duration,
                coverPhotoId: processedPhotos[0].id,
            };

            await createTrip(trip);
            const photosWithTripId = processedPhotos.map((p) => ({ ...p, tripId }));
            await addPhotosToTrip(tripId, photosWithTripId);

            router.push(`/play/${tripId}`);
        } catch (err) {
            console.error('Failed to create trip:', err);
            setError(t('create.errors.saveFailed'));
            setIsProcessing(false);
        }
    };

    return (
        <main className="min-h-screen pb-24">
            <header className="p-6 pt-12">
                <div className="max-w-2xl mx-auto">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>{t('create.back')}</span>
                    </button>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <div className="flex items-center gap-3 mb-2">
                            <Sparkles className="w-6 h-6 text-purple-400" />
                            <h1 className="text-2xl font-bold text-white">{t('create.title')}</h1>
                        </div>
                        <p className="text-white/60">{t('create.subtitle')}</p>
                    </motion.div>
                </div>
            </header>

            <div className="px-6 max-w-2xl mx-auto space-y-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <label className="block text-sm text-white/60 mb-2">{t('create.tripName')}</label>
                    <input
                        type="text"
                        value={tripName}
                        onChange={(e) => setTripName(e.target.value)}
                        placeholder={t('create.tripNamePlaceholder')}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-purple-500 focus:outline-none transition-colors"
                    />
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <PhotoDropzone
                        onFilesSelected={handleFilesSelected}
                        isProcessing={isProcessing}
                        processingProgress={processingProgress}
                    />
                </motion.div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center gap-3"
                        >
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <p className="text-red-200 text-sm">{error}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {processedPhotos.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">
                                    {t('create.photosReady', { count: processedPhotos.length })}
                                </h3>
                                <button
                                    onClick={() => setProcessedPhotos([])}
                                    className="text-sm text-white/50 hover:text-white transition-colors"
                                >
                                    {t('create.clearAll')}
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4 p-4 bg-white/5 rounded-xl">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-white">{processedPhotos.length}</p>
                                    <p className="text-xs text-white/50">{t('create.stats.photos')}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-white">
                                        {processedPhotos.filter((p) => p.latitude).length}
                                    </p>
                                    <p className="text-xs text-white/50">{t('create.stats.withGps')}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-white">
                                        {calculateAchievements(processedPhotos).length}
                                    </p>
                                    <p className="text-xs text-white/50">{t('create.stats.achievements')}</p>
                                </div>
                            </div>

                            <button
                                onClick={handleCreateTrip}
                                disabled={isProcessing || !tripName.trim()}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? t('create.creating') : t('create.createButton')}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
