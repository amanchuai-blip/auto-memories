'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import PhotoDropzone from '@/components/PhotoDropzone';
import { processImages } from '@/lib/imageUtils';
import { calculateAchievements, generateRouteFromPhotos, calculateTotalDistance, calculateDuration } from '@/lib/achievements';
import { createTrip, addPhotosToTrip, getAllTrips } from '@/lib/db';
import type { Photo, Trip } from '@/types';

export default function CreatePage() {
    const router = useRouter();
    const [tripName, setTripName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0, filename: '' });
    const [error, setError] = useState<string | null>(null);
    const [processedPhotos, setProcessedPhotos] = useState<Photo[]>([]);

    const handleBack = () => router.push('/');

    const handleFilesSelected = useCallback(async (files: File[]) => {
        setError(null);
        setIsProcessing(true);

        try {
            const processed = await processImages(files, (current, total, filename) => {
                setProcessingProgress({ current, total, filename });
            });

            if (processed.length === 0) {
                setError('ERROR: 処理失敗');
                setIsProcessing(false);
                return;
            }

            const validPhotos = processed.filter((p) => p.timestamp !== null);
            if (validPhotos.length === 0) {
                setError('ERROR: タイムスタンプなし');
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
            setError('ERROR: 不明なエラー');
        } finally {
            setIsProcessing(false);
        }
    }, [tripName]);

    const handleCreateTrip = async () => {
        if (processedPhotos.length === 0 || !tripName.trim()) return;

        setIsProcessing(true);
        setError(null);

        try {
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
            setError('ERROR: 保存失敗');
            setIsProcessing(false);
        }
    };

    return (
        <main
            className="min-h-screen bg-black text-white relative overflow-hidden"
            style={{ fontFamily: "'VT323', 'Courier New', monospace" }}
        >
            {/* VHS Effects */}
            <div
                className="fixed inset-0 pointer-events-none z-50 opacity-15"
                style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px)' }}
            />

            {/* Header */}
            <header className="sticky top-0 z-40 bg-black/90 border-b-2 border-white/20 backdrop-blur-sm">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="border-2 border-white/50 px-4 py-2 text-sm tracking-widest hover:bg-white/10 active:scale-95 transition-all"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                        ← BACK
                    </button>
                    <div>
                        <h1 className="text-lg tracking-widest">NEW RECORDING</h1>
                        <p className="text-white/40 text-xs tracking-wider">新規記録</p>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-40">
                {/* Title input */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <label className="text-white/50 text-sm tracking-widest mb-2 block">TAPE LABEL</label>
                    <input
                        type="text"
                        value={tripName}
                        onChange={(e) => setTripName(e.target.value)}
                        placeholder="例: 夏の京都旅行"
                        className="w-full px-4 py-4 bg-black border-2 border-white/30 text-white text-xl tracking-wider placeholder-white/20 focus:border-amber-400 focus:outline-none transition-colors"
                    />
                </motion.div>

                {/* Photo dropzone */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <PhotoDropzone
                        onFilesSelected={handleFilesSelected}
                        isProcessing={isProcessing}
                        processingProgress={processingProgress}
                    />
                    <p className="text-white/30 text-sm mt-3 text-center tracking-wider">
                        ※ 大量選択時は処理に時間がかかります
                    </p>
                </motion.div>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="border-2 border-red-500 p-4 bg-red-500/10"
                        >
                            <p className="text-red-500 text-lg tracking-wider">{error}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Results */}
                <AnimatePresence>
                    {processedPhotos.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-4"
                        >
                            <div className="border-2 border-green-500/50 p-4 bg-green-500/5">
                                <div className="flex items-center gap-4">
                                    <span className="text-4xl">✓</span>
                                    <div>
                                        <p className="text-green-400 text-xl tracking-wider">{processedPhotos.length} FRAMES LOADED</p>
                                        <p className="text-white/50 text-sm">
                                            GPS: {processedPhotos.filter((p) => p.latitude).length} •
                                            予測実績: {calculateAchievements(processedPhotos).length}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setProcessedPhotos([])}
                                className="w-full py-3 text-white/40 text-sm tracking-wider hover:text-white transition-colors"
                            >
                                [CLEAR]
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Record button */}
            <AnimatePresence>
                {processedPhotos.length > 0 && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-black via-black/95 to-transparent"
                    >
                        <div className="max-w-lg mx-auto">
                            <button
                                type="button"
                                onClick={handleCreateTrip}
                                disabled={isProcessing || !tripName.trim()}
                                className="w-full py-5 border-4 border-red-500 bg-red-500/10 text-red-500 text-2xl tracking-[0.3em] hover:bg-red-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4"
                                style={{ WebkitTapHighlightColor: 'transparent' }}
                            >
                                {isProcessing ? (
                                    <>
                                        <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.5, repeat: Infinity }}>●</motion.span>
                                        RECORDING...
                                    </>
                                ) : (
                                    <>● REC</>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* VHS Font */}
            <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
      `}</style>
        </main>
    );
}
