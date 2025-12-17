'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Loader2, AlertCircle } from 'lucide-react';
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
                setError('日付情報がありません');
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
            console.error(err);
            setError('エラーが発生しました');
        } finally {
            setIsProcessing(false);
        }
    }, [tripName]);

    const handleCreateTrip = async () => {
        if (processedPhotos.length === 0 || !tripName.trim()) return;

        setIsProcessing(true);
        try {
            const existingTrips = await getAllTrips();
            const isFirstTrip = existingTrips.length === 0;

            const route = generateRouteFromPhotos(processedPhotos);
            const achievements = calculateAchievements(processedPhotos, isFirstTrip);
            const totalDistance = calculateTotalDistance(route);
            const duration = calculateDuration(processedPhotos);

            const sorted = [...processedPhotos].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

            const tripId = crypto.randomUUID();
            const trip: Trip = {
                id: tripId,
                name: tripName.trim(),
                createdAt: new Date(),
                updatedAt: new Date(),
                startDate: sorted[0].timestamp,
                endDate: sorted[sorted.length - 1].timestamp,
                route,
                achievements,
                totalPhotos: processedPhotos.length,
                totalDistance,
                duration,
                coverPhotoId: processedPhotos[0].id,
            };

            await createTrip(trip);
            await addPhotosToTrip(tripId, processedPhotos.map((p) => ({ ...p, tripId })));

            router.push(`/play/${tripId}`);
        } catch (err) {
            console.error(err);
            setError('保存に失敗');
            setIsProcessing(false);
        }
    };

    return (
        <main className="min-h-[100dvh] bg-black text-white flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-lg border-b border-white/5">
                <div className="px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => router.push('/')}
                        className="p-2 -ml-2 rounded-full active:bg-white/10"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="font-semibold">新しい記録</h1>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 p-4 space-y-4 pb-32">
                {/* Title */}
                <div>
                    <label className="text-xs text-white/40 mb-1 block">タイトル</label>
                    <input
                        type="text"
                        value={tripName}
                        onChange={(e) => setTripName(e.target.value)}
                        placeholder="例: 夏の京都旅行"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:border-violet-500 focus:outline-none"
                    />
                </div>

                {/* Dropzone */}
                <PhotoDropzone
                    onFilesSelected={handleFilesSelected}
                    isProcessing={isProcessing}
                    processingProgress={processingProgress}
                />

                <p className="text-xs text-white/30 text-center">
                    ※ 大量の写真は処理に時間がかかります
                </p>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2"
                        >
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            <p className="text-red-300 text-sm">{error}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Success */}
                <AnimatePresence>
                    {processedPhotos.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-xl bg-green-500/10 border border-green-500/20"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <Check className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-green-300">{processedPhotos.length}枚準備完了</p>
                                    <p className="text-xs text-white/40">
                                        GPS: {processedPhotos.filter(p => p.latitude).length}枚
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Button */}
            <AnimatePresence>
                {processedPhotos.length > 0 && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-black via-black to-transparent"
                    >
                        <button
                            onClick={handleCreateTrip}
                            disabled={isProcessing || !tripName.trim()}
                            className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 transition-all"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    作成中...
                                </>
                            ) : (
                                '記録を作成'
                            )}
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
