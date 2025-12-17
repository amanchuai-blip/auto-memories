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
        <div className="fixed inset-0 z-50 bg-black overflow-hidden touch-none">
            {/* Control overlay */}
            <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-center safe-area-top">
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="px-5 py-3 bg-black/70 backdrop-blur-sm rounded-full text-white text-base font-medium"
                >
                    {isPlaying ? '⏸ 一時停止' : '▶️ 再生'}
                </button>
                <div className="text-white/60 text-lg font-medium">
                    {phase === 'journey' && `${currentIndex + 1}/${sortedPhotos.length}`}
                </div>
                <button
                    onClick={handleExit}
                    className="px-5 py-3 bg-black/70 backdrop-blur-sm rounded-full text-white text-base font-medium"
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
                        className="absolute inset-0 p-2"
                    >
                        <div
                            className="grid gap-1 w-full h-full"
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
                                    className="overflow-hidden rounded-lg"
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
                            <div className="text-center px-8">
                                <h1 className="text-4xl font-bold text-white mb-3">{trip.name}</h1>
                                <p className="text-white/70 text-xl">{sortedPhotos.length}枚の写真</p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* PHASE 2: JOURNEY - Mobile optimized vertical layout */}
            <AnimatePresence>
                {phase === 'journey' && currentPhoto && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col pt-16"
                    >
                        {/* Map - Top 35% */}
                        <div className="relative h-[35%] min-h-[180px]">
                            <MapView
                                route={route}
                                isAnimating={isPlaying}
                                currentPointIndex={Math.min(currentIndex, route.length - 1)}
                                className="w-full h-full"
                            />

                            {/* Stats on map */}
                            <div className="absolute bottom-3 left-3 right-3 flex gap-2">
                                <div className="bg-black/80 backdrop-blur-sm px-4 py-2 rounded-xl">
                                    <span className="text-white text-lg font-bold">{cumulativeDistance} km</span>
                                </div>
                                <div className="bg-black/80 backdrop-blur-sm px-4 py-2 rounded-xl">
                                    <span className="text-white/80 text-base">
                                        {currentPhoto.timestamp.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Photo - Bottom 65% */}
                        <div className="relative flex-1 bg-black p-3 pb-20">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentPhoto.id}
                                    initial={{ opacity: 0, y: 30, rotateX: -10 }}
                                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.5 }}
                                    className="w-full h-full rounded-2xl overflow-hidden shadow-2xl"
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

                                    {/* Photo date overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-5">
                                        <p className="text-white/80 text-lg">
                                            {currentPhoto.timestamp.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}
                                        </p>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Progress bar */}
                            <div className="absolute bottom-6 left-3 right-3">
                                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
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

            {/* PHASE 3: MONTAGE */}
            <AnimatePresence>
                {phase === 'montage' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black flex items-center justify-center"
                    >
                        <AnimatePresence mode="sync">
                            {[0, 1, 2].map((offset) => {
                                const idx = (montageIndex + offset) % sortedPhotos.length;
                                const positions = [
                                    { top: '10%', left: '5%', width: '60%', rotate: -5 },
                                    { top: '25%', right: '5%', width: '55%', rotate: 4 },
                                    { bottom: '15%', left: '15%', width: '50%', rotate: -3 },
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
                                        <div className="bg-white p-2 pb-10 rounded-sm">
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
                        className="absolute inset-0 flex items-center justify-center bg-black p-8"
                    >
                        <div className="text-center w-full max-w-md">
                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="text-3xl font-bold text-white mb-8"
                            >
                                {trip.name}
                            </motion.h2>

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="grid grid-cols-3 gap-4 mb-10"
                            >
                                <div className="bg-white/10 rounded-2xl p-4">
                                    <p className="text-3xl font-bold text-white">{trip.totalPhotos}</p>
                                    <p className="text-base text-white/50 mt-1">写真</p>
                                </div>
                                <div className="bg-white/10 rounded-2xl p-4">
                                    <p className="text-3xl font-bold text-white">{trip.totalDistance}</p>
                                    <p className="text-base text-white/50 mt-1">km</p>
                                </div>
                                <div className="bg-white/10 rounded-2xl p-4">
                                    <p className="text-3xl font-bold text-amber-400">{achievements.length}</p>
                                    <p className="text-base text-white/50 mt-1">実績</p>
                                </div>
                            </motion.div>

                            {achievements.length > 0 && (
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    className="flex flex-wrap justify-center gap-3 mb-10"
                                >
                                    {achievements.map((a, i) => (
                                        <motion.div
                                            key={a.id}
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ delay: 0.8 + i * 0.1 }}
                                            className="bg-white/10 px-4 py-2 rounded-full flex items-center gap-2"
                                        >
                                            <span className="text-xl">{ACHIEVEMENT_DEFINITIONS[a.type].icon}</span>
                                            <span className="text-base text-white">{ACHIEVEMENT_DEFINITIONS[a.type].title}</span>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}

                            <motion.button
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 1.2 }}
                                onClick={handleExit}
                                className="w-full py-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl text-white text-xl font-bold"
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
