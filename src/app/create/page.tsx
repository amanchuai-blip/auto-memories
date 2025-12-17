'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertCircle, Check, Loader2 } from 'lucide-react';
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
                setError('写真を処理できませんでした');
                setIsProcessing(false);
                return;
            }

            const validPhotos = processed.filter((p) => p.timestamp !== null);
            if (validPhotos.length === 0) {
                setError('日付情報のある写真が見つかりません');
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
            setError('処理中にエラーが発生しました');
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
            setError('保存に失敗しました');
            setIsProcessing(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#0a0a0f]">
            {/* Header */}
            <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0a0a0f]/90 border-b border-white/5">
                <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
                    <button
                        type="button"
                        onClick={handleBack}
                        className="p-2 -ml-2 rounded-full active:bg-white/10 transition-colors"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                    >
                        <ArrowLeft className="w-6 h-6 text-white" />
                    </button>
                    <div>
                        <h1 className="text-lg font-semibold text-white">新しい思い出</h1>
                        <p className="text-xs text-white/40">写真をアップロードして作成</p>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-lg mx-auto px-4 py-6 space-y-6 pb-40">
                {/* Trip name */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                >
                    <label className="text-sm font-medium text-white/60">タイトル</label>
                    <input
                        type="text"
                        value={tripName}
                        onChange={(e) => setTripName(e.target.value)}
                        placeholder="例: 夏の京都旅行"
                        className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white text-lg placeholder-white/25 focus:border-purple-500/50 focus:bg-white/[0.08] focus:outline-none transition-all"
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
                    <p className="text-xs text-white/30 mt-3 text-center">
                        ※ 多くの写真を選択すると処理に時間がかかります
                    </p>
                </motion.div>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
                        >
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <p className="text-red-300 text-sm">{error}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Results */}
                <AnimatePresence>
                    {processedPhotos.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-4"
                        >
                            {/* Success message */}
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <Check className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-white font-medium">{processedPhotos.length}枚の写真</p>
                                    <p className="text-white/50 text-sm">
                                        GPS: {processedPhotos.filter((p) => p.latitude).length}枚 •
                                        実績予測: {calculateAchievements(processedPhotos).length}個
                                    </p>
                                </div>
                            </div>

                            {/* Clear */}
                            <button
                                type="button"
                                onClick={() => setProcessedPhotos([])}
                                className="w-full py-3 text-white/40 text-sm active:text-white transition-colors"
                            >
                                クリアして選び直す
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom action */}
            <AnimatePresence>
                {processedPhotos.length > 0 && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/95 to-transparent"
                    >
                        <div className="max-w-lg mx-auto">
                            <button
                                type="button"
                                onClick={handleCreateTrip}
                                disabled={isProcessing || !tripName.trim()}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg font-semibold rounded-2xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3"
                                style={{ WebkitTapHighlightColor: 'transparent' }}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        作成中...
                                    </>
                                ) : (
                                    '思い出を作成'
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
