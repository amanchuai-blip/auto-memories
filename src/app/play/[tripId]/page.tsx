'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Trash2, Loader2 } from 'lucide-react';
import { useTrip } from '@/hooks/useTrips';
import { deleteTrip } from '@/lib/db';
import EndRoll from '@/components/EndRoll';
import { ACHIEVEMENT_DEFINITIONS } from '@/types';

interface PlayPageProps {
    params: Promise<{ tripId: string }>;
}

export default function PlayPage({ params }: PlayPageProps) {
    const { tripId } = use(params);
    const router = useRouter();
    const { trip, photos, isLoading } = useTrip(tripId);
    const [showEndRoll, setShowEndRoll] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        if (!trip) return;
        if (confirm(`「${trip.name}」を削除しますか？`)) {
            setIsDeleting(true);
            try {
                await deleteTrip(trip.id);
                router.push('/');
            } catch (err) {
                console.error(err);
                setError('削除に失敗しました');
                setIsDeleting(false);
            }
        }
    };

    const handlePlay = () => {
        if (photos.length === 0) {
            setError('写真データがありません');
            return;
        }
        setShowEndRoll(true);
    };

    if (isLoading) {
        return (
            <main style={{
                minHeight: '100dvh',
                background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1025 50%, #0f0a1a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <Loader2 size={48} color="#8b5cf6" style={{ animation: 'spin 1s linear infinite' }} />
                <style jsx global>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
            </main>
        );
    }

    if (!trip) {
        return (
            <main style={{
                minHeight: '100dvh',
                background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1025 50%, #0f0a1a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                padding: '32px',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '20px', marginBottom: '20px', color: 'rgba(255,255,255,0.7)' }}>
                        この記録は見つかりませんでした
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        style={{
                            padding: '14px 28px',
                            fontSize: '18px',
                            color: 'white',
                            backgroundColor: '#8b5cf6',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: 'pointer',
                        }}
                    >
                        ホームに戻る
                    </button>
                </div>
            </main>
        );
    }

    // Safe access with defaults for old data
    const safeTrip = {
        ...trip,
        achievements: trip.achievements || [],
        route: trip.route || [],
        totalPhotos: trip.totalPhotos || photos.length || 0,
        totalDistance: trip.totalDistance || 0,
    };

    if (showEndRoll && photos.length > 0) {
        return (
            <EndRoll
                trip={safeTrip}
                photos={photos}
                onComplete={() => setShowEndRoll(false)}
                onExit={() => setShowEndRoll(false)}
            />
        );
    }

    return (
        <main style={{
            minHeight: '100dvh',
            background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1025 50%, #0f0a1a 100%)',
            color: 'white',
            fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
        }}>
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
                justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                        onClick={() => router.push('/')}
                        style={{
                            padding: '10px',
                            marginLeft: '-10px',
                            borderRadius: '50%',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        <ArrowLeft size={26} color="white" />
                    </button>
                    <h1 style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        maxWidth: '180px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>
                        {safeTrip.name}
                    </h1>
                </div>

                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    style={{
                        padding: '10px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(239,68,68,0.2)',
                        border: 'none',
                        cursor: isDeleting ? 'wait' : 'pointer',
                    }}
                >
                    {isDeleting ? (
                        <Loader2 size={22} color="#f87171" style={{ animation: 'spin 1s linear infinite' }} />
                    ) : (
                        <Trash2 size={22} color="#f87171" />
                    )}
                </button>
            </header>

            <div style={{ padding: '20px' }}>
                {/* Error message */}
                {error && (
                    <div style={{
                        padding: '14px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        marginBottom: '16px',
                        color: '#fca5a5',
                        fontSize: '16px',
                    }}>
                        {error}
                    </div>
                )}

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                    <div style={{
                        textAlign: 'center',
                        padding: '16px 8px',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderRadius: '16px',
                    }}>
                        <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{safeTrip.totalPhotos}</p>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>写真</p>
                    </div>
                    <div style={{
                        textAlign: 'center',
                        padding: '16px 8px',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderRadius: '16px',
                    }}>
                        <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{safeTrip.totalDistance}</p>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>km</p>
                    </div>
                    <div style={{
                        textAlign: 'center',
                        padding: '16px 8px',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderRadius: '16px',
                    }}>
                        <p style={{ fontSize: '28px', fontWeight: 'bold' }}>{safeTrip.achievements.length}</p>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>実績</p>
                    </div>
                </div>

                {/* Achievements */}
                {safeTrip.achievements.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px' }}>獲得実績</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {safeTrip.achievements.slice(0, 6).map((a) => {
                                const def = ACHIEVEMENT_DEFINITIONS[a.type];
                                return (
                                    <div
                                        key={a.id}
                                        style={{
                                            padding: '8px 12px',
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                            borderRadius: '16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                        }}
                                    >
                                        <span style={{ fontSize: '16px' }}>{def?.icon || '🏆'}</span>
                                        <span style={{ fontSize: '14px' }}>{def?.title || '実績'}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Photo count check */}
                {photos.length === 0 && (
                    <div style={{
                        padding: '20px',
                        borderRadius: '16px',
                        backgroundColor: 'rgba(251,191,36,0.1)',
                        border: '1px solid rgba(251,191,36,0.2)',
                        marginBottom: '20px',
                        textAlign: 'center',
                    }}>
                        <p style={{ color: '#fbbf24', fontSize: '16px' }}>
                            写真データが読み込めませんでした
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginTop: '8px' }}>
                            この記録は古い形式のため再生できない可能性があります
                        </p>
                    </div>
                )}

                {/* Play button */}
                <button
                    onClick={handlePlay}
                    disabled={photos.length === 0}
                    style={{
                        width: '100%',
                        padding: '18px',
                        background: photos.length > 0 ? 'linear-gradient(to right, #8b5cf6, #ec4899)' : 'rgba(100,100,100,0.3)',
                        border: 'none',
                        borderRadius: '16px',
                        color: photos.length > 0 ? 'white' : 'rgba(255,255,255,0.4)',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        cursor: photos.length > 0 ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                    }}
                >
                    <Play size={24} />
                    {photos.length > 0 ? '再生する' : '再生できません'}
                </button>
            </div>

            <style jsx global>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </main>
    );
}
