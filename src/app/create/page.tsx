'use client';

import { useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Loader2, AlertCircle, Camera } from 'lucide-react';
import { processImages } from '@/lib/imageUtils';
import { calculateAchievements, generateRouteFromPhotos, calculateTotalDistance, calculateDuration } from '@/lib/achievements';
import { createTrip, addPhotosToTrip, getAllTrips } from '@/lib/db';
import type { Photo, Trip } from '@/types';

export default function CreatePage() {
    const router = useRouter();
    const [tripName, setTripName] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingProgress, setProcessingProgress] = useState({ current: 0, total: 0 });
    const [error, setError] = useState<string | null>(null);
    const [processedPhotos, setProcessedPhotos] = useState<Photo[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSelectFiles = () => {
        if (isProcessing) return;
        // Use the hidden input
        inputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setError(null);
        setIsProcessing(true);
        setProcessingProgress({ current: 0, total: files.length });

        try {
            const processed = await processImages(Array.from(files), (current, total) => {
                setProcessingProgress({ current, total });
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

            // Auto-set trip name
            const sorted = [...photos].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            const startDate = sorted[0].timestamp;
            const month = startDate.toLocaleDateString('ja-JP', { month: 'long' });
            if (!tripName) {
                setTripName(`${month}の旅`);
            }
        } catch (err) {
            console.error(err);
            setError('エラーが発生しました');
        } finally {
            setIsProcessing(false);
            // Reset input so same files can be selected again
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const handleCreateTrip = async () => {
        if (processedPhotos.length === 0 || isProcessing) return;

        const finalName = tripName.trim() || '新しい旅';

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

            const tripId = crypto.randomUUID();
            const trip: Trip = {
                id: tripId,
                name: finalName,
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
            setError('保存に失敗しました。もう一度お試しください。');
            setIsProcessing(false);
        }
    };

    const canCreate = processedPhotos.length > 0 && !isProcessing;

    return (
        <main style={{
            minHeight: '100dvh',
            background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1025 50%, #0f0a1a 100%)',
            color: 'white',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        }}>
            {/* Hidden file input */}
            <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />

            {/* Background */}
            <div style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.15) 0%, transparent 50%)',
                pointerEvents: 'none',
            }} />

            {/* Header */}
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 40,
                backgroundColor: 'rgba(10,10,10,0.8)',
                backdropFilter: 'blur(20px)',
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
            <div style={{ padding: '20px', paddingBottom: '160px' }}>
                {/* Title Input */}
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px', display: 'block' }}>
                        タイトル
                    </label>
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

                {/* Photo Selection */}
                <button
                    type="button"
                    onClick={handleSelectFiles}
                    disabled={isProcessing}
                    style={{
                        width: '100%',
                        borderRadius: '20px',
                        padding: '40px 24px',
                        textAlign: 'center',
                        border: '2px dashed rgba(255,255,255,0.2)',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        cursor: isProcessing ? 'wait' : 'pointer',
                    }}
                >
                    {isProcessing ? (
                        <div>
                            <Loader2 size={48} color="#a78bfa" style={{ animation: 'spin 1s linear infinite' }} />
                            <p style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginTop: '16px' }}>
                                処理中...
                            </p>
                            {processingProgress.total > 0 && (
                                <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.6)', marginTop: '8px' }}>
                                    {processingProgress.current} / {processingProgress.total}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div>
                            <div style={{
                                width: '72px',
                                height: '72px',
                                margin: '0 auto 16px',
                                borderRadius: '18px',
                                background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(236,72,153,0.3))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Camera size={36} color="white" />
                            </div>
                            <p style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
                                写真を選択
                            </p>
                            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', marginTop: '8px' }}>
                                タップして写真を追加
                            </p>
                        </div>
                    )}
                </button>

                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: '12px' }}>
                    ※ 追加を押してから表示まで時間がかかる場合があります
                </p>
                <div style={{
                    fontSize: '12px',
                    color: 'rgba(251,191,36,0.9)',
                    textAlign: 'center',
                    marginTop: '12px',
                    padding: '12px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(251,191,36,0.1)',
                    border: '1px solid rgba(251,191,36,0.2)',
                    lineHeight: '1.6',
                }}>
                    <p>⚠️ まれに再生中の読み込みに失敗することがあります。</p>
                    <p style={{ marginTop: '4px' }}>その場合はタブを閉じるかリロードをお願いします。</p>
                    <p style={{ marginTop: '4px' }}>※ リロードすると過去に作成したデータは消えてしまいます。申し訳ありません。</p>
                    <p style={{ marginTop: '8px', fontWeight: '500' }}>📹 映像は画面録画で保存してください</p>
                </div>

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
                            <p style={{ color: '#fca5a5', fontSize: '16px' }}>{error}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Success */}
                <AnimatePresence>
                    {processedPhotos.length > 0 && !isProcessing && (
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
                                    width: '52px',
                                    height: '52px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(34,197,94,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Check size={26} color="#4ade80" />
                                </div>
                                <div>
                                    <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#86efac' }}>
                                        {processedPhotos.length}枚準備完了
                                    </p>
                                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                                        GPS: {processedPhotos.filter(p => p.latitude).length}枚
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Button */}
            <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '20px',
                paddingBottom: 'max(28px, env(safe-area-inset-bottom))',
                background: 'linear-gradient(to top, rgba(10,10,10,0.98) 70%, transparent)',
            }}>
                <button
                    onClick={handleCreateTrip}
                    disabled={!canCreate}
                    style={{
                        width: '100%',
                        padding: '18px',
                        background: canCreate ? 'linear-gradient(to right, #8b5cf6, #ec4899)' : 'rgba(100,100,100,0.3)',
                        border: 'none',
                        borderRadius: '16px',
                        color: canCreate ? 'white' : 'rgba(255,255,255,0.4)',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        cursor: canCreate ? 'pointer' : 'not-allowed',
                    }}
                >
                    {isProcessing ? '処理中...' : processedPhotos.length > 0 ? '記録を作成' : '写真を選択してください'}
                </button>
            </div>

            <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
        </main>
    );
}
