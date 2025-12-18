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
        <main style={{
            minHeight: '100dvh',
            backgroundColor: 'black',
            color: 'white',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
            display: 'flex',
            flexDirection: 'column',
        }}>
            {/* Header */}
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 40,
                backgroundColor: 'rgba(0,0,0,0.9)',
                backdropFilter: 'blur(10px)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                padding: '16px 20px',
                paddingTop: 'max(16px, env(safe-area-inset-top))',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
            }}>
                <button
                    onClick={() => router.push('/')}
                    style={{
                        padding: '12px',
                        marginLeft: '-12px',
                        borderRadius: '50%',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                    }}
                >
                    <ArrowLeft size={28} color="white" />
                </button>
                <h1 style={{ fontSize: '22px', fontWeight: 'bold' }}>新しい記録</h1>
            </header>

            {/* Content */}
            <div style={{ flex: 1, padding: '20px', paddingBottom: '140px' }}>
                {/* Title */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', display: 'block', fontWeight: '500' }}>タイトル</label>
                    <input
                        type="text"
                        value={tripName}
                        onChange={(e) => setTripName(e.target.value)}
                        placeholder="例: 夏の京都旅行"
                        style={{
                            width: '100%',
                            padding: '18px 20px',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '16px',
                            color: 'white',
                            fontSize: '20px',
                            outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>

                {/* Dropzone */}
                <PhotoDropzone
                    onFilesSelected={handleFilesSelected}
                    isProcessing={isProcessing}
                    processingProgress={processingProgress}
                />

                <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: '16px' }}>
                    ※ 大量の写真は処理に時間がかかります
                </p>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            style={{
                                padding: '16px',
                                borderRadius: '16px',
                                backgroundColor: 'rgba(239,68,68,0.1)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginTop: '20px',
                            }}
                        >
                            <AlertCircle size={24} color="#f87171" />
                            <p style={{ color: '#fca5a5', fontSize: '18px' }}>{error}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Success */}
                <AnimatePresence>
                    {processedPhotos.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                padding: '20px',
                                borderRadius: '16px',
                                backgroundColor: 'rgba(34,197,94,0.1)',
                                border: '1px solid rgba(34,197,94,0.2)',
                                marginTop: '20px',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(34,197,94,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Check size={28} color="#4ade80" />
                                </div>
                                <div>
                                    <p style={{ fontSize: '22px', fontWeight: 'bold', color: '#86efac' }}>{processedPhotos.length}枚準備完了</p>
                                    <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
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
                        style={{
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            padding: '20px',
                            paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
                            background: 'linear-gradient(to top, black 60%, transparent)',
                        }}
                    >
                        <button
                            onClick={handleCreateTrip}
                            disabled={isProcessing || !tripName.trim()}
                            style={{
                                width: '100%',
                                padding: '20px',
                                background: 'linear-gradient(to right, #8b5cf6, #ec4899)',
                                border: 'none',
                                borderRadius: '16px',
                                color: 'white',
                                fontSize: '22px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                opacity: isProcessing || !tripName.trim() ? 0.5 : 1,
                            }}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 size={24} className="animate-spin" />
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
