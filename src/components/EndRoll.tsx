'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import type { Photo, Trip } from '@/types';
import { ACHIEVEMENT_DEFINITIONS } from '@/types';
import { calculateCumulativeDistance } from '@/lib/storyGenerator';

const MapView = dynamic(() => import('./MapView'), { ssr: false });

interface EndRollProps {
    trip: Trip;
    photos: Photo[];
    onComplete?: () => void;
    onExit?: () => void;
}

type Phase = 'grid' | 'journey' | 'montage' | 'credits';

export default function EndRoll({ trip, photos, onComplete, onExit }: EndRollProps) {
    const route = trip.route;
    const achievements = trip.achievements;

    const [phase, setPhase] = useState<Phase>('grid');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [montageIndex, setMontageIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [gridZoomTarget, setGridZoomTarget] = useState<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const sortedPhotos = useMemo(() =>
        [...photos].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
        [photos]
    );

    const currentPhoto = sortedPhotos[currentIndex];
    const cumulativeDistance = calculateCumulativeDistance(sortedPhotos, currentIndex);

    const photoUrls = useMemo(() =>
        sortedPhotos.map(p => URL.createObjectURL(p.blob)),
        [sortedPhotos]
    );

    // Audio
    useEffect(() => {
        const init = () => {
            if (audioRef.current) return;
            const audio = new Audio('/audio/bgm.mp3');
            audio.loop = true;
            audio.volume = 0.5;
            audioRef.current = audio;
            audio.play().catch(() => { });
        };
        window.addEventListener('touchstart', init, { once: true });
        window.addEventListener('click', init, { once: true });
        init();
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Phase progression
    useEffect(() => {
        if (!isPlaying) return;
        let timeout: NodeJS.Timeout;

        switch (phase) {
            case 'grid':
                timeout = setTimeout(() => {
                    setGridZoomTarget(0);
                    setTimeout(() => setPhase('journey'), 1500);
                }, 3000);
                break;
            case 'journey':
                if (currentIndex < sortedPhotos.length - 1) {
                    timeout = setTimeout(() => setCurrentIndex(i => i + 1), 3500);
                } else {
                    timeout = setTimeout(() => setPhase('montage'), 1500);
                }
                break;
            case 'montage':
                if (montageIndex < sortedPhotos.length - 1) {
                    timeout = setTimeout(() => setMontageIndex(i => i + 1), 400);
                } else {
                    timeout = setTimeout(() => setPhase('credits'), 800);
                }
                break;
            case 'credits':
                timeout = setTimeout(() => onComplete?.(), 8000);
                break;
        }

        return () => clearTimeout(timeout);
    }, [phase, isPlaying, currentIndex, montageIndex, sortedPhotos.length, onComplete]);

    const handleExit = useCallback(() => {
        if (audioRef.current) audioRef.current.pause();
        onExit?.();
    }, [onExit]);

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'black',
                zIndex: 9999,
                overflow: 'hidden',
                touchAction: 'none',
            }}
        >
            {/* Controls */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                paddingTop: 'max(12px, env(safe-area-inset-top))',
            }}>
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        fontSize: '14px',
                    }}
                >
                    {isPlaying ? '⏸ 停止' : '▶️ 再生'}
                </button>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px' }}>
                    {phase === 'journey' && `${currentIndex + 1}/${sortedPhotos.length}`}
                </span>
                <button
                    onClick={handleExit}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '20px',
                        fontSize: '14px',
                    }}
                >
                    ✕ 終了
                </button>
            </div>

            {/* GRID Phase */}
            <AnimatePresence>
                {phase === 'grid' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 3 }}
                        transition={{ duration: 1.5 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            padding: '4px',
                            display: 'grid',
                            gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(sortedPhotos.length))}, 1fr)`,
                            gap: '2px',
                        }}
                    >
                        {sortedPhotos.map((photo, i) => (
                            <motion.div
                                key={photo.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{
                                    opacity: gridZoomTarget === i ? 1 : gridZoomTarget !== null ? 0 : 1,
                                    scale: gridZoomTarget === i ? 10 : 1,
                                    zIndex: gridZoomTarget === i ? 10 : 0,
                                }}
                                transition={{
                                    delay: gridZoomTarget === null ? i * 0.03 : 0,
                                    duration: gridZoomTarget === i ? 1.5 : 0.2,
                                }}
                                style={{ overflow: 'hidden' }}
                            >
                                <img
                                    src={photoUrls[i]}
                                    alt=""
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            </motion.div>
                        ))}

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'rgba(0,0,0,0.5)',
                            }}
                        >
                            <div style={{ textAlign: 'center', padding: '24px' }}>
                                <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>{trip.name}</h1>
                                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '18px' }}>{sortedPhotos.length}枚の写真</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* JOURNEY Phase */}
            <AnimatePresence>
                {phase === 'journey' && currentPhoto && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute',
                            top: '50px',
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                    >
                        {/* Map */}
                        <div style={{ height: '25%', minHeight: '120px', position: 'relative' }}>
                            <MapView
                                route={route}
                                isAnimating={isPlaying}
                                currentPointIndex={Math.min(currentIndex, route.length - 1)}
                                className="w-full h-full"
                            />
                            <div style={{
                                position: 'absolute',
                                bottom: '8px',
                                left: '8px',
                                display: 'flex',
                                gap: '8px',
                            }}>
                                <span style={{
                                    backgroundColor: 'rgba(0,0,0,0.8)',
                                    color: 'white',
                                    padding: '4px 12px',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                }}>
                                    {cumulativeDistance} km
                                </span>
                            </div>
                        </div>

                        {/* Photo Container - FIXED */}
                        <div style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '8px',
                            paddingBottom: '60px',
                            backgroundColor: 'black',
                            overflow: 'hidden',
                        }}>
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={currentPhoto.id}
                                    src={photoUrls[currentIndex]}
                                    alt=""
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        objectFit: 'contain',
                                        borderRadius: '8px',
                                    }}
                                />
                            </AnimatePresence>

                            {/* Date */}
                            <div style={{
                                position: 'absolute',
                                bottom: '70px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                backgroundColor: 'rgba(0,0,0,0.6)',
                                color: 'rgba(255,255,255,0.8)',
                                padding: '4px 16px',
                                borderRadius: '20px',
                                fontSize: '14px',
                            }}>
                                {currentPhoto.timestamp.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}
                            </div>

                            {/* Progress */}
                            <div style={{
                                position: 'absolute',
                                bottom: '20px',
                                left: '16px',
                                right: '16px',
                                height: '4px',
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                borderRadius: '2px',
                                overflow: 'hidden',
                            }}>
                                <motion.div
                                    style={{
                                        height: '100%',
                                        background: 'linear-gradient(to right, #8b5cf6, #ec4899)',
                                    }}
                                    animate={{ width: `${((currentIndex + 1) / sortedPhotos.length) * 100}%` }}
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MONTAGE Phase */}
            <AnimatePresence>
                {phase === 'montage' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'black',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                        }}
                    >
                        <AnimatePresence mode="sync">
                            {[0, 1, 2].map((offset) => {
                                const idx = (montageIndex + offset) % sortedPhotos.length;
                                const styles = [
                                    { top: '10%', left: '5%', width: '50%', rotate: -5 },
                                    { top: '20%', right: '5%', width: '45%', rotate: 4 },
                                    { bottom: '15%', left: '15%', width: '40%', rotate: -3 },
                                ];
                                const s = styles[offset];

                                return (
                                    <motion.div
                                        key={`${idx}-${montageIndex}`}
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1, rotate: s.rotate }}
                                        exit={{ opacity: 0, scale: 1.2 }}
                                        transition={{ duration: 0.3 }}
                                        style={{
                                            position: 'absolute',
                                            ...s,
                                            zIndex: 3 - offset,
                                            backgroundColor: 'white',
                                            padding: '4px',
                                            paddingBottom: '24px',
                                            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                                        }}
                                    >
                                        <img
                                            src={photoUrls[idx]}
                                            alt=""
                                            style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }}
                                        />
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CREDITS Phase */}
            <AnimatePresence>
                {phase === 'credits' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'black',
                            padding: '24px',
                        }}
                    >
                        <div style={{ textAlign: 'center', maxWidth: '320px', width: '100%' }}>
                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '24px' }}
                            >
                                {trip.name}
                            </motion.h2>

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '32px' }}
                            >
                                <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px' }}>
                                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{trip.totalPhotos}</p>
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>写真</p>
                                </div>
                                <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px' }}>
                                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>{trip.totalDistance}</p>
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>km</p>
                                </div>
                                <div style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px' }}>
                                    <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#fbbf24' }}>{achievements.length}</p>
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>実績</p>
                                </div>
                            </motion.div>

                            {achievements.length > 0 && (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginBottom: '32px' }}
                                >
                                    {achievements.slice(0, 5).map((a, i) => (
                                        <motion.div
                                            key={a.id}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.8 + i * 0.1 }}
                                            style={{
                                                backgroundColor: 'rgba(255,255,255,0.1)',
                                                padding: '6px 12px',
                                                borderRadius: '20px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                            }}
                                        >
                                            <span style={{ fontSize: '16px' }}>{ACHIEVEMENT_DEFINITIONS[a.type].icon}</span>
                                            <span style={{ fontSize: '12px', color: 'white' }}>{ACHIEVEMENT_DEFINITIONS[a.type].title}</span>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}

                            <motion.button
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 1.2 }}
                                onClick={handleExit}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    background: 'linear-gradient(to right, #8b5cf6, #ec4899)',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: 'white',
                                    fontSize: '18px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                }}
                            >
                                おわり
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
