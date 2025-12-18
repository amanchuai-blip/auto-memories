'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Trash2 } from 'lucide-react';
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

    const handleDelete = async () => {
        if (!trip) return;
        if (confirm(`「${trip.name}」を削除しますか？`)) {
            setIsDeleting(true);
            await deleteTrip(trip.id);
            router.push('/');
        }
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
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{
                        width: '48px',
                        height: '48px',
                        border: '4px solid #8b5cf6',
                        borderTopColor: 'transparent',
                        borderRadius: '50%',
                    }}
                />
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
                    <p style={{ fontSize: '24px', marginBottom: '20px' }}>見つかりません</p>
                    <button
                        onClick={() => router.push('/')}
                        style={{
                            fontSize: '20px',
                            color: '#a78bfa',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        戻る
                    </button>
                </div>
            </main>
        );
    }

    if (showEndRoll) {
        return (
            <EndRoll
                trip={trip}
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
            position: 'relative',
        }}>
            {/* Background decoration */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
                    <h1 style={{
                        fontSize: '22px',
                        fontWeight: 'bold',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}>{trip.name}</h1>
                </div>

                {/* Delete button */}
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    style={{
                        padding: '12px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(239,68,68,0.2)',
                        border: 'none',
                        cursor: 'pointer',
                        opacity: isDeleting ? 0.5 : 1,
                    }}
                >
                    <Trash2 size={24} color="#ef4444" />
                </button>
            </header>

            <div style={{ padding: '20px', position: 'relative', zIndex: 1 }}>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
                    <div style={{
                        textAlign: 'center',
                        padding: '20px 12px',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '20px',
                        border: '1px solid rgba(255,255,255,0.05)',
                    }}>
                        <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{trip.totalPhotos}</p>
                        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>写真</p>
                    </div>
                    <div style={{
                        textAlign: 'center',
                        padding: '20px 12px',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '20px',
                        border: '1px solid rgba(255,255,255,0.05)',
                    }}>
                        <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{trip.totalDistance}</p>
                        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>km</p>
                    </div>
                    <div style={{
                        textAlign: 'center',
                        padding: '20px 12px',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '20px',
                        border: '1px solid rgba(255,255,255,0.05)',
                    }}>
                        <p style={{ fontSize: '32px', fontWeight: 'bold' }}>{trip.achievements.length}</p>
                        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>実績</p>
                    </div>
                </div>

                {/* Achievements preview */}
                {trip.achievements.length > 0 && (
                    <div style={{ marginBottom: '24px' }}>
                        <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px', fontWeight: '500' }}>獲得実績</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {trip.achievements.slice(0, 6).map((a) => (
                                <div
                                    key={a.id}
                                    style={{
                                        padding: '10px 16px',
                                        backgroundColor: 'rgba(255,255,255,0.05)',
                                        backdropFilter: 'blur(10px)',
                                        borderRadius: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                    }}
                                >
                                    <span style={{ fontSize: '20px' }}>{ACHIEVEMENT_DEFINITIONS[a.type].icon}</span>
                                    <span style={{ fontSize: '16px' }}>{ACHIEVEMENT_DEFINITIONS[a.type].title}</span>
                                </div>
                            ))}
                            {trip.achievements.length > 6 && (
                                <div style={{ padding: '10px 16px', color: 'rgba(255,255,255,0.4)', fontSize: '16px' }}>
                                    +{trip.achievements.length - 6}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Play button */}
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowEndRoll(true)}
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
                        boxShadow: '0 8px 32px rgba(139,92,246,0.3)',
                    }}
                >
                    <Play size={28} />
                    再生する
                </motion.button>
            </div>
        </main>
    );
}
