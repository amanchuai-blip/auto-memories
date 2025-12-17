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

    // Generate photo URLs
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
                // Zoom into first photo after showing grid
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
                    // Fast cuts - 400ms each
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
        <div className="fixed inset-0 z-50 bg-black overflow-hidden touch-none">
            {/* Control overlay - always accessible */}
            <div className="absolute top-0 left-0 right-0 z-50 p-3 flex justify-between items-center">
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="px-3 py-2 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs"
                >
                    {isPlaying ? '⏸' : '▶️'}
                </button>
                <div className="text-white/50 text-xs">
                    {phase === 'journey' && `${currentIndex + 1}/${sortedPhotos.length}`}
                </div>
                <button
                    onClick={handleExit}
                    className="px-3 py-2 bg-black/60 backdrop-blur-sm rounded-full text-white text-xs"
                >
                    ✕
                </button>
            </div>

            {/* PHASE 1: GRID - All photos at once */}
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

                        {/* Title overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="absolute inset-0 flex items-center justify-center bg-black/40"
                        >
                            <div className="text-center px-6">
                                <h1 className="text-3xl font-bold text-white mb-2">{trip.name}</h1>
                                <p className="text-white/60 text-sm">{sortedPhotos.length}枚の写真</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PHASE 2: JOURNEY - Map + Photo + Stats */}
            <AnimatePresence>
                {phase === 'journey' && currentPhoto && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col"
                    >
                        {/* Map - Top half on mobile */}
                        <div className="relative flex-1 min-h-[40vh]">
                            <MapView
                                route={route}
                                isAnimating={isPlaying}
                                currentPointIndex={Math.min(currentIndex, route.length - 1)}
                                className="w-full h-full"
                            />

                            {/* Stats overlay on map */}
                            <div className="absolute bottom-2 left-2 right-2 flex gap-2">
                                <div className="bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                    <span className="text-white text-sm font-bold">{cumulativeDistance} km</span>
                                </div>
                                <div className="bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                    <span className="text-white/60 text-xs">
                                        {currentPhoto.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Photo - Bottom half */}
                        <div className="relative flex-1 min-h-[50vh] bg-black">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentPhoto.id}
                                    initial={{ opacity: 0, y: 50, rotateX: -15 }}
                                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.5 }}
                                    className="absolute inset-2 rounded-xl overflow-hidden shadow-2xl"
                                    style={{ perspective: '1000px' }}
                                >
                                    <motion.img
                                        src={photoUrls[currentIndex]}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        initial={{ scale: 1.1 }}
                                        animate={{ scale: 1 }}
                                        transition={{ duration: 3.5 }}
                                    />

                                    {/* Photo info overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                        <p className="text-white/60 text-xs">
                                            {currentPhoto.timestamp.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Timeline dots */}
                            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 px-4">
                                {sortedPhotos.slice(
                                    Math.max(0, currentIndex - 3),
                                    Math.min(sortedPhotos.length, currentIndex + 4)
                                ).map((_, i) => {
                                    const actualIndex = Math.max(0, currentIndex - 3) + i;
                                    return (
                                        <div
                                            key={actualIndex}
                                            className={`w-1.5 h-1.5 rounded-full transition-all ${actualIndex === currentIndex ? 'bg-white w-4' : 'bg-white/30'
                                                }`}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PHASE 3: MONTAGE - Fast cuts collage */}
            <AnimatePresence>
                {phase === 'montage' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black"
                    >
                        {/* Multiple photos at once with different sizes/positions */}
                        <AnimatePresence mode="sync">
                            {[0, 1, 2].map((offset) => {
                                const idx = (montageIndex + offset) % sortedPhotos.length;
                                const positions = [
                                    { top: '5%', left: '5%', width: '55%', rotate: -3, z: 3 },
                                    { top: '30%', right: '5%', width: '50%', rotate: 5, z: 2 },
                                    { bottom: '10%', left: '15%', width: '45%', rotate: -2, z: 1 },
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
                                            zIndex: pos.z,
                                        }}
                                    >
                                        <div className="bg-white p-1.5 pb-8">
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

                        {/* Beat indicator */}
                        <motion.div
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{ duration: 0.4, repeat: Infinity }}
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/20"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PHASE 4: CREDITS */}
            <AnimatePresence>
                {phase === 'credits' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 flex items-center justify-center bg-black p-6"
                    >
                        <div className="text-center w-full max-w-sm">
                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="text-2xl font-bold text-white mb-6"
                            >
                                {trip.name}
                            </motion.h2>

                            {/* Stats */}
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="grid grid-cols-3 gap-4 mb-8"
                            >
                                <div className="bg-white/5 rounded-xl p-3">
                                    <p className="text-2xl font-bold text-white">{trip.totalPhotos}</p>
                                    <p className="text-xs text-white/40">写真</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3">
                                    <p className="text-2xl font-bold text-white">{trip.totalDistance}</p>
                                    <p className="text-xs text-white/40">km</p>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3">
                                    <p className="text-2xl font-bold text-amber-400">{achievements.length}</p>
                                    <p className="text-xs text-white/40">実績</p>
                                </div>
                            </motion.div>

                            {/* Achievements */}
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
                                            <span>{ACHIEVEMENT_DEFINITIONS[a.type].icon}</span>
                                            <span className="text-xs text-white">{ACHIEVEMENT_DEFINITIONS[a.type].title}</span>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}

                            {/* End button */}
                            <motion.button
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 1.2 }}
                                onClick={handleExit}
                                className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
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
