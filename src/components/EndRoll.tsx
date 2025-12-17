'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import type { Photo, Trip } from '@/types';
import { ACHIEVEMENT_DEFINITIONS } from '@/types';
import {
    generatePhotoNarrative,
    calculateCumulativeDistance,
    getTimeGapLabel,
} from '@/lib/storyGenerator';

const MapView = dynamic(() => import('./MapView'), { ssr: false });

interface EndRollProps {
    trip: Trip;
    photos: Photo[];
    onComplete?: () => void;
    onExit?: () => void;
}

export default function EndRoll({ trip, photos, onComplete, onExit }: EndRollProps) {
    const route = trip.route;
    const achievements = trip.achievements;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [phase, setPhase] = useState<'intro' | 'journey' | 'credits'>('intro');
    const [isPlaying, setIsPlaying] = useState(true);
    const [showGlitch, setShowGlitch] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const sortedPhotos = useMemo(() =>
        [...photos].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
        [photos]
    );

    const currentPhoto = sortedPhotos[currentIndex];
    const prevPhoto = currentIndex > 0 ? sortedPhotos[currentIndex - 1] : null;
    const cumulativeDistance = calculateCumulativeDistance(sortedPhotos, currentIndex);
    const timeGapLabel = prevPhoto && currentPhoto ? getTimeGapLabel(prevPhoto, currentPhoto) : null;
    const narrative = currentPhoto
        ? generatePhotoNarrative(currentPhoto, prevPhoto, currentIndex, sortedPhotos.length)
        : '';

    // VHS timestamp format
    const formatVHSTime = (date: Date) => {
        return date.toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }).replace(/\//g, '.').replace(/ /, ' ');
    };

    // Audio init
    useEffect(() => {
        const initAudio = () => {
            if (audioRef.current) return;
            const audio = new Audio('/audio/bgm.mp3');
            audio.loop = true;
            audio.volume = 0.5;
            audioRef.current = audio;
            audio.play().catch(() => { });
        };

        window.addEventListener('touchstart', initAudio, { once: true });
        window.addEventListener('click', initAudio, { once: true });
        initAudio();

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Glitch on photo change
    useEffect(() => {
        setShowGlitch(true);
        const t = setTimeout(() => setShowGlitch(false), 200);
        return () => clearTimeout(t);
    }, [currentIndex]);

    // Phase progression
    useEffect(() => {
        if (!isPlaying) return;
        let timeout: NodeJS.Timeout;

        switch (phase) {
            case 'intro':
                timeout = setTimeout(() => setPhase('journey'), 3500);
                break;
            case 'journey':
                if (currentIndex < sortedPhotos.length - 1) {
                    const delay = timeGapLabel ? 5000 : 4000;
                    timeout = setTimeout(() => setCurrentIndex(i => i + 1), delay);
                } else {
                    timeout = setTimeout(() => setPhase('credits'), 2000);
                }
                break;
            case 'credits':
                timeout = setTimeout(() => onComplete?.(), 10000);
                break;
        }

        return () => { if (timeout) clearTimeout(timeout); };
    }, [phase, isPlaying, currentIndex, sortedPhotos.length, timeGapLabel, onComplete]);

    const handleExit = useCallback(() => {
        if (audioRef.current) audioRef.current.pause();
        onExit?.();
    }, [onExit]);

    const photoUrl = currentPhoto ? URL.createObjectURL(currentPhoto.blob) : '';

    return (
        <div className="fixed inset-0 z-50 bg-black overflow-hidden" style={{ fontFamily: "'VT323', 'Courier New', monospace" }}>
            {/* VHS Scan Lines */}
            <div
                className="absolute inset-0 z-40 pointer-events-none opacity-20"
                style={{
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
                }}
            />

            {/* VHS Noise */}
            <div
                className="absolute inset-0 z-40 pointer-events-none opacity-[0.08] mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                    animation: 'noise 0.5s steps(10) infinite',
                }}
            />

            {/* VHS Tracking Glitch */}
            <AnimatePresence>
                {showGlitch && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        animate={{ opacity: [1, 0.5, 1, 0.3, 1] }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-45 pointer-events-none"
                        style={{
                            background: 'linear-gradient(180deg, transparent 90%, rgba(255,255,255,0.1) 92%, transparent 94%)',
                        }}
                    />
                )}
            </AnimatePresence>

            {/* REC Indicator */}
            <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
                <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-3 h-3 rounded-full bg-red-600"
                />
                <span className="text-red-500 text-lg font-bold tracking-wider">● REC</span>
            </div>

            {/* VHS Timestamp */}
            {currentPhoto && phase === 'journey' && (
                <div className="absolute bottom-20 right-4 z-50 text-right">
                    <p className="text-amber-400 text-xl tracking-wider drop-shadow-lg" style={{ textShadow: '2px 2px 0 #000' }}>
                        {formatVHSTime(currentPhoto.timestamp)}
                    </p>
                    <p className="text-amber-400/70 text-sm mt-1">
                        {cumulativeDistance} KM
                    </p>
                </div>
            )}

            {/* Cancel Button - Always visible */}
            <button
                onClick={handleExit}
                className="absolute top-4 right-4 z-50 px-4 py-2 bg-black/80 border-2 border-white/50 text-white text-sm uppercase tracking-widest hover:bg-white/20 active:scale-95 transition-all"
            >
                ■ STOP
            </button>

            {/* Play/Pause */}
            <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute bottom-4 left-4 z-50 px-4 py-2 bg-black/80 border-2 border-white/50 text-white text-sm uppercase tracking-widest hover:bg-white/20 active:scale-95 transition-all"
            >
                {isPlaying ? '❚❚ PAUSE' : '▶ PLAY'}
            </button>

            {/* Skip Button */}
            <button
                onClick={() => setPhase('credits')}
                className="absolute bottom-4 right-4 z-50 px-4 py-2 bg-black/80 border-2 border-white/50 text-white text-sm uppercase tracking-widest hover:bg-white/20 active:scale-95 transition-all"
            >
                ▶▶ SKIP
            </button>

            {/* INTRO */}
            <AnimatePresence>
                {phase === 'intro' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center z-30"
                    >
                        <div className="text-center">
                            <motion.div
                                initial={{ scaleY: 0 }}
                                animate={{ scaleY: 1 }}
                                transition={{ duration: 0.3 }}
                                className="border-4 border-white/80 p-8 bg-black/50"
                            >
                                <motion.h1
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="text-4xl md:text-6xl text-white tracking-widest mb-4"
                                >
                                    {trip.name}
                                </motion.h1>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1 }}
                                    className="text-amber-400 text-xl tracking-wider"
                                >
                                    {trip.startDate?.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </motion.div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* JOURNEY - Map + Photo */}
            <AnimatePresence>
                {phase === 'journey' && currentPhoto && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20"
                    >
                        {/* Full screen Map */}
                        <div className="absolute inset-0">
                            <MapView
                                route={route}
                                isAnimating={isPlaying}
                                currentPointIndex={Math.min(currentIndex, route.length - 1)}
                                className="w-full h-full"
                            />
                        </div>

                        {/* Time Gap Overlay */}
                        <AnimatePresence>
                            {timeGapLabel && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex items-center justify-center z-35 bg-black/80"
                                >
                                    <div className="border-4 border-white/60 px-12 py-6">
                                        <p className="text-4xl text-white tracking-[0.5em]">{timeGapLabel}</p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Photo - PiP style in corner */}
                        <motion.div
                            key={currentPhoto.id}
                            initial={{ opacity: 0, scale: 0.8, rotate: -2 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.4 }}
                            className="absolute top-16 right-4 w-[45%] md:w-[35%] aspect-[4/3] z-30"
                        >
                            {/* Photo frame - VHS style */}
                            <div className="w-full h-full bg-black p-1 border-4 border-white/30 shadow-2xl">
                                <div className="w-full h-full overflow-hidden relative">
                                    <motion.img
                                        src={photoUrl}
                                        alt=""
                                        className="w-full h-full object-cover"
                                        initial={{ scale: 1.1 }}
                                        animate={{ scale: 1.2, x: [-5, 5, -5], y: [-3, 3, -3] }}
                                        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                                        style={{ filter: 'saturate(0.9) contrast(1.1)' }}
                                    />
                                    {/* VHS color aberration */}
                                    <div className="absolute inset-0 pointer-events-none" style={{
                                        background: 'linear-gradient(90deg, rgba(255,0,0,0.05) 0%, transparent 5%, transparent 95%, rgba(0,255,255,0.05) 100%)',
                                    }} />
                                </div>
                            </div>
                        </motion.div>

                        {/* Narrative - Bottom left */}
                        <motion.div
                            key={`narrative-${currentIndex}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="absolute bottom-24 left-4 right-[50%] z-30 bg-black/70 p-4 border-l-4 border-amber-400"
                        >
                            <p className="text-white text-lg leading-relaxed">
                                {narrative}
                            </p>
                            <p className="text-amber-400/60 text-sm mt-2">
                                {currentIndex + 1} / {sortedPhotos.length}
                            </p>
                        </motion.div>

                        {/* Counter overlay */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
                            <div className="bg-black/80 px-6 py-2 border border-white/30">
                                <span className="text-white text-2xl tracking-[0.3em]">
                                    {String(currentIndex + 1).padStart(3, '0')}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CREDITS - VHS Style */}
            <AnimatePresence>
                {phase === 'credits' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center z-30 bg-black"
                    >
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: '-100%' }}
                            transition={{ duration: 15, ease: 'linear' }}
                            className="text-center"
                        >
                            <div className="h-[50vh]" />

                            <div className="border-4 border-white/60 p-8 mb-12">
                                <h2 className="text-5xl text-white tracking-widest mb-4">{trip.name}</h2>
                                <p className="text-amber-400 text-xl">THE END</p>
                            </div>

                            <div className="grid grid-cols-3 gap-8 mb-12 text-white">
                                <div>
                                    <p className="text-4xl">{trip.totalPhotos}</p>
                                    <p className="text-sm text-white/50 tracking-widest">PHOTOS</p>
                                </div>
                                <div>
                                    <p className="text-4xl">{trip.totalDistance}</p>
                                    <p className="text-sm text-white/50 tracking-widest">KM</p>
                                </div>
                                <div>
                                    <p className="text-4xl">{achievements.length}</p>
                                    <p className="text-sm text-white/50 tracking-widest">ACHIEVEMENTS</p>
                                </div>
                            </div>

                            {/* Achievements - ONLY here */}
                            {achievements.length > 0 && (
                                <div className="mb-12">
                                    <p className="text-white/50 text-sm tracking-widest mb-6">UNLOCKED</p>
                                    <div className="flex flex-wrap justify-center gap-4">
                                        {achievements.map(a => (
                                            <div key={a.id} className="border-2 border-white/30 px-4 py-2 bg-black/50">
                                                <span className="text-2xl mr-2">{ACHIEVEMENT_DEFINITIONS[a.type].icon}</span>
                                                <span className="text-white text-sm">{ACHIEVEMENT_DEFINITIONS[a.type].title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <p className="text-white/30 text-sm tracking-[0.5em]">AUTO MEMORIES</p>

                            <div className="h-[50vh]" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CSS Animations */}
            <style jsx global>{`
        @keyframes noise {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-1%, -1%); }
          20% { transform: translate(1%, 1%); }
          30% { transform: translate(-1%, 1%); }
          40% { transform: translate(1%, -1%); }
          50% { transform: translate(-1%, 0%); }
          60% { transform: translate(1%, 0%); }
          70% { transform: translate(0%, 1%); }
          80% { transform: translate(0%, -1%); }
          90% { transform: translate(1%, 1%); }
        }
        @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
      `}</style>
        </div>
    );
}
