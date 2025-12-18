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
            className="fixed inset-0 z-50 bg-black touch-none"
            style={{
                width: '100vw',
                height: '100dvh',
                maxWidth: '100vw',
                maxHeight: '100dvh',
                overflow: 'hidden',
            }}
        >
            {/* Control overlay - fixed positioning */}
            <div
                className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center px-3 py-3"
                style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
            >
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="px-4 py-2 bg-black/80 backdrop-blur-sm rounded-full text-white text-sm font-medium"
                >
                    {isPlaying ? '⏸ 停止' : '▶️ 再生'}
                </button>
                <div className="text-white/60 text-base font-medium">
                    {phase === 'journey' && `${currentIndex + 1}/${sortedPhotos.length}`}
                </div>
                <button
                    onClick={handleExit}
                    className="px-4 py-2 bg-black/80 backdrop-blur-sm rounded-full text-white text-sm font-medium"
                >
                    ✕ 終了
                </button>
            </div>

            {/* PHASE 1: GRID */}
            <AnimatePresence>
                {phase === 'grid' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 3 }}
                        transition={{ duration: 1.5 }}
                        className="absolute inset-0 p-1"
                    >
                        <div
                            className="grid gap-0.5 w-full h-full"
                            style={{
                                gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(sortedPhotos.length))}, 1fr)`,
                                gridTemplateRows: `repeat(${Math.ceil(sortedPhotos.length / Math.ceil(Math.sqrt(sortedPhotos.length)))}, 1fr)`,
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
                                        delay: gridZoomTarget === null ? i * 0.05 : 0,
                                        duration: gridZoomTarget === i ? 1.5 : 0.3,
                                    }}
                                    className="overflow-hidden"
                                >
                                    <img
                                        src={photoUrls[i]}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                </motion.div>
                            ))}
                        </div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/50"
                        >
                            <div className="text-center px-6">
                                <h1 className="text-3xl font-bold text-white mb-2">{trip.name}</h1>
                                <p className="text-white/70 text-lg">{sortedPhotos.length}枚の写真</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PHASE 2: JOURNEY - Fixed viewport layout */}
            <AnimatePresence>
                {phase === 'journey' && currentPhoto && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col"
                        style={{ paddingTop: '60px' }}
                    >
                        {/* Map - Fixed height */}
                        <div className="relative" style={{ height: '30vh', minHeight: '150px' }}>
                            <MapView
                                route={route}
                                isAnimating={isPlaying}
                                currentPointIndex={Math.min(currentIndex, route.length - 1)}
                                className="w-full h-full"
                            />

                            {/* Stats on map */}
                            <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                                <div className="bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                                    <span className="text-white text-base font-bold">{cumulativeDistance} km</span>
                                </div>
                                <div className="bg-black/80 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                                    <span className="text-white/80 text-sm">
                                        {currentPhoto.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Photo - Remaining space with object-contain */}
                        <div
                            className="relative flex-1 bg-black flex items-center justify-center p-2"
                            style={{ paddingBottom: 'max(60px, env(safe-area-inset-bottom))' }}
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentPhoto.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.4 }}
                                    className="w-full h-full flex items-center justify-center"
                                >
                                    <img
                                        src={photoUrls[currentIndex]}
                                        alt=""
                                        className="max-w-full max-h-full object-contain rounded-lg"
                                        style={{ maxHeight: 'calc(100% - 40px)' }}
                                    />
                                </motion.div>
                            </AnimatePresence>

                            {/* Photo date overlay */}
                            <div className="absolute bottom-16 left-4 right-4 text-center">
                                <p className="text-white/80 text-base bg-black/50 inline-block px-4 py-1 rounded-full">
                                    {currentPhoto.timestamp.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}
                                </p>
                            </div>

                            {/* Progress bar */}
                            <div className="absolute bottom-4 left-4 right-4">
                                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                                        animate={{ width: `${((currentIndex + 1) / sortedPhotos.length) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PHASE 3: MONTAGE - Contained */}
            <AnimatePresence>
                {phase === 'montage' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black flex items-center justify-center overflow-hidden"
                    >
                        <AnimatePresence mode="sync">
                            {[0, 1, 2].map((offset) => {
                                const idx = (montageIndex + offset) % sortedPhotos.length;
                                const positions = [
                                    { top: '15%', left: '5%', width: '50%', rotate: -5 },
                                    { top: '25%', right: '5%', width: '45%', rotate: 4 },
                                    { bottom: '20%', left: '20%', width: '40%', rotate: -3 },
                                ];
                                const pos = positions[offset];

                                return (
                                    <motion.div
                                        key={`${idx}-${montageIndex}`}
                                        initial={{ opacity: 0, scale: 0.5, rotate: pos.rotate * 2 }}
                                        animate={{ opacity: 1, scale: 1, rotate: pos.rotate }}
                                        exit={{ opacity: 0, scale: 1.2 }}
                                        transition={{ duration: 0.3 }}
                                        className="absolute shadow-2xl"
                                        style={{
                                            top: pos.top,
                                            left: pos.left,
                                            right: pos.right,
                                            bottom: pos.bottom,
                                            width: pos.width,
                                            zIndex: 3 - offset,
                                        }}
                                    >
                                        <div className="bg-white p-1 pb-6 rounded-sm">
                                            <img
                                                src={photoUrls[idx]}
                                                alt=""
                                                className="w-full aspect-square object-cover"
                                            />
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PHASE 4: CREDITS */}
            <AnimatePresence>
                {phase === 'credits' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 flex items-center justify-center bg-black p-6 overflow-auto"
                    >
                        <div className="text-center w-full max-w-sm">
                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="text-2xl font-bold text-white mb-6"
                            >
                                {trip.name}
                            </motion.h2>

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="grid grid-cols-3 gap-3 mb-8"
                            >
                                <div className="bg-white/10 rounded-xl p-3">
                                    <p className="text-2xl font-bold text-white">{trip.totalPhotos}</p>
                                    <p className="text-sm text-white/50">写真</p>
                                </div>
                                <div className="bg-white/10 rounded-xl p-3">
                                    <p className="text-2xl font-bold text-white">{trip.totalDistance}</p>
                                    <p className="text-sm text-white/50">km</p>
                                </div>
                                <div className="bg-white/10 rounded-xl p-3">
                                    <p className="text-2xl font-bold text-amber-400">{achievements.length}</p>
                                    <p className="text-sm text-white/50">実績</p>
                                </div>
                            </motion.div>

                            {achievements.length > 0 && (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    className="flex flex-wrap justify-center gap-2 mb-8"
                                >
                                    {achievements.map((a, i) => (
                                        <motion.div
                                            key={a.id}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.8 + i * 0.1 }}
                                            className="bg-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5"
                                        >
                                            <span className="text-lg">{ACHIEVEMENT_DEFINITIONS[a.type].icon}</span>
                                            <span className="text-sm text-white">{ACHIEVEMENT_DEFINITIONS[a.type].title}</span>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}

                            <motion.button
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 1.2 }}
                                onClick={handleExit}
                                className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl text-white text-lg font-bold"
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
