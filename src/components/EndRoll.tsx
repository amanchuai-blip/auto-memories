'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import type { Photo, Trip } from '@/types';
import { ACHIEVEMENT_DEFINITIONS } from '@/types';
import {
    generatePhotoNarrative,
    calculateSpeed,
    calculateCumulativeDistance,
    getTimeGapLabel,
    generateKenBurnsParams,
} from '@/lib/storyGenerator';
import { Play, Pause, Volume2, VolumeX, X, SkipForward, ChevronRight } from 'lucide-react';

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
    const [phase, setPhase] = useState<'intro' | 'journey' | 'credits' | 'complete'>('intro');
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [audioReady, setAudioReady] = useState(false);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Sort photos by timestamp
    const sortedPhotos = useMemo(() =>
        [...photos].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
        [photos]
    );

    const currentPhoto = sortedPhotos[currentIndex];
    const prevPhoto = currentIndex > 0 ? sortedPhotos[currentIndex - 1] : null;

    // Stats
    const currentSpeed = prevPhoto && currentPhoto ? calculateSpeed(prevPhoto, currentPhoto) : 0;
    const cumulativeDistance = calculateCumulativeDistance(sortedPhotos, currentIndex);
    const timeGapLabel = prevPhoto && currentPhoto ? getTimeGapLabel(prevPhoto, currentPhoto) : null;
    const narrative = currentPhoto
        ? generatePhotoNarrative(currentPhoto, prevPhoto, currentIndex, sortedPhotos.length)
        : '';
    const kenBurns = generateKenBurnsParams(currentIndex);

    // Initialize audio with user interaction (iOS compatible)
    const initAudio = useCallback(() => {
        if (audioRef.current || audioReady) return;

        const audio = new Audio('/audio/bgm.mp3');
        audio.loop = true;
        audio.volume = 0.6;
        audioRef.current = audio;

        audio.play().then(() => {
            setAudioReady(true);
        }).catch(() => {
            // iOS requires user interaction - will try again
            console.log('Audio needs user interaction');
        });
    }, [audioReady]);

    // Try to play audio on mount and interaction
    useEffect(() => {
        const handleInteraction = () => {
            if (!audioReady) {
                initAudio();
            }
        };

        window.addEventListener('touchstart', handleInteraction, { once: true });
        window.addEventListener('click', handleInteraction, { once: true });

        // Try immediately
        initAudio();

        return () => {
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('click', handleInteraction);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [initAudio, audioReady]);

    // Control audio playback
    useEffect(() => {
        if (!audioRef.current) return;

        if (isPlaying && !isMuted) {
            audioRef.current.play().catch(() => { });
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying, isMuted]);

    // Mute control
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.muted = isMuted;
        }
    }, [isMuted]);

    // Auto-hide controls
    useEffect(() => {
        if (showControls) {
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 4000);
        }
        return () => {
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, [showControls]);

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
                    const delay = timeGapLabel ? 5500 : 4500;
                    timeout = setTimeout(() => setCurrentIndex(i => i + 1), delay);
                } else {
                    timeout = setTimeout(() => setPhase('credits'), 2000);
                }
                break;
            case 'credits':
                timeout = setTimeout(() => {
                    setPhase('complete');
                    onComplete?.();
                }, 12000);
                break;
        }

        return () => { if (timeout) clearTimeout(timeout); };
    }, [phase, isPlaying, currentIndex, sortedPhotos.length, timeGapLabel, onComplete]);

    const handleInteraction = useCallback(() => {
        setShowControls(true);
        initAudio();
    }, [initAudio]);

    const handleExit = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        onExit?.();
    }, [onExit]);

    const skipToCredits = useCallback(() => {
        setPhase('credits');
    }, []);

    // Get photo URL
    const photoUrl = currentPhoto ? URL.createObjectURL(currentPhoto.blob) : '';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0a0a0f] z-50 overflow-hidden"
            onMouseMove={handleInteraction}
            onTouchStart={handleInteraction}
        >
            {/* Film grain effect */}
            <div
                className="absolute inset-0 z-50 pointer-events-none opacity-[0.03] mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Cinematic bars */}
            <div className="absolute top-0 left-0 right-0 h-[6vh] bg-black z-40" />
            <div className="absolute bottom-0 left-0 right-0 h-[6vh] bg-black z-40" />

            {/* INTRO PHASE */}
            <AnimatePresence>
                {phase === 'intro' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center z-30"
                    >
                        <div className="text-center px-8">
                            <motion.h1
                                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ delay: 0.3, duration: 0.8 }}
                                className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-4"
                            >
                                {trip.name}
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.5 }}
                                transition={{ delay: 1, duration: 0.6 }}
                                className="text-white/50 tracking-widest text-sm uppercase"
                            >
                                {trip.totalPhotos} photos • {trip.totalDistance} km
                            </motion.p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* JOURNEY PHASE */}
            <AnimatePresence>
                {phase === 'journey' && currentPhoto && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20"
                    >
                        {/* Background Map */}
                        <div className="absolute inset-0">
                            <MapView
                                route={route}
                                isAnimating={isPlaying}
                                currentPointIndex={Math.min(currentIndex, route.length - 1)}
                                className="w-full h-full"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/70" />
                        </div>

                        {/* Time Gap Overlay */}
                        <AnimatePresence>
                            {timeGapLabel && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex items-center justify-center z-35 bg-black/70"
                                >
                                    <motion.p
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-4xl md:text-6xl font-light text-white tracking-widest"
                                    >
                                        {timeGapLabel}
                                    </motion.p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Main Photo with Ken Burns */}
                        <motion.div
                            key={currentPhoto.id}
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6 }}
                            className="absolute inset-[8%] md:right-[10%] md:left-auto md:w-[50%] rounded-2xl overflow-hidden shadow-2xl z-25"
                            style={{
                                boxShadow: '0 30px 100px rgba(0,0,0,0.8)',
                            }}
                        >
                            <motion.div
                                initial={{
                                    scale: kenBurns.startScale,
                                    x: `${kenBurns.startX}%`,
                                    y: `${kenBurns.startY}%`,
                                }}
                                animate={{
                                    scale: kenBurns.endScale,
                                    x: `${kenBurns.endX}%`,
                                    y: `${kenBurns.endY}%`,
                                }}
                                transition={{ duration: 4.5, ease: 'linear' }}
                                className="w-full h-full"
                            >
                                <img
                                    src={photoUrl}
                                    alt=""
                                    className="w-full h-full object-cover"
                                />
                            </motion.div>

                            {/* Vignette */}
                            <div className="absolute inset-0 pointer-events-none" style={{
                                background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
                            }} />
                        </motion.div>

                        {/* Left side info */}
                        <div className="absolute left-[5%] top-[15%] bottom-[20%] w-[35%] hidden md:flex flex-col justify-between z-25">
                            {/* Stats */}
                            <div className="space-y-3">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm"
                                >
                                    <span className="text-2xl">🗺️</span>
                                    <div>
                                        <p className="text-xl font-bold text-white">{cumulativeDistance} km</p>
                                        <p className="text-xs text-white/40">移動距離</p>
                                    </div>
                                </motion.div>

                                {currentSpeed > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="flex items-center gap-3 p-3 rounded-xl bg-white/5 backdrop-blur-sm"
                                    >
                                        <span className="text-2xl">⚡</span>
                                        <div>
                                            <p className="text-xl font-bold text-white">{currentSpeed} km/h</p>
                                            <p className="text-xs text-white/40">速度</p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Narrative */}
                            <motion.div
                                key={`narrative-${currentIndex}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-2"
                            >
                                <p className="text-xl md:text-2xl font-light text-white leading-relaxed">
                                    {narrative}
                                </p>
                                <p className="text-white/30 text-sm">
                                    {currentPhoto.timestamp.toLocaleString('ja-JP', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </motion.div>
                        </div>

                        {/* Progress bar */}
                        <div className="absolute bottom-[8%] left-[5%] right-[5%] z-25">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                                        initial={{ width: '0%' }}
                                        animate={{ width: `${((currentIndex + 1) / sortedPhotos.length) * 100}%` }}
                                    />
                                </div>
                                <p className="text-xs text-white/40 tabular-nums">
                                    {currentIndex + 1}/{sortedPhotos.length}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CREDITS PHASE - with achievements */}
            <AnimatePresence>
                {phase === 'credits' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center z-30"
                    >
                        <motion.div
                            className="text-center max-w-lg px-8"
                            initial={{ y: 50 }}
                            animate={{ y: 0 }}
                            transition={{ duration: 1 }}
                        >
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-4xl md:text-5xl font-bold text-white mb-8"
                            >
                                {trip.name}
                            </motion.h2>

                            {/* Stats */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="grid grid-cols-3 gap-6 mb-10"
                            >
                                <div>
                                    <p className="text-3xl font-bold text-white">{trip.totalPhotos}</p>
                                    <p className="text-xs text-white/40 uppercase tracking-wider">写真</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-white">{trip.totalDistance}</p>
                                    <p className="text-xs text-white/40 uppercase tracking-wider">km</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold text-purple-400">{achievements.length}</p>
                                    <p className="text-xs text-white/40 uppercase tracking-wider">実績</p>
                                </div>
                            </motion.div>

                            {/* Achievements - only shown here */}
                            {achievements.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 1 }}
                                    className="mb-10"
                                >
                                    <p className="text-xs text-white/40 uppercase tracking-widest mb-4">獲得実績</p>
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {achievements.map((a, i) => (
                                            <motion.div
                                                key={a.id}
                                                initial={{ opacity: 0, scale: 0 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 1.2 + i * 0.1 }}
                                                className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 backdrop-blur-sm"
                                            >
                                                <span className="text-lg">{ACHIEVEMENT_DEFINITIONS[a.type].icon}</span>
                                                <span className="text-sm text-white/70">{ACHIEVEMENT_DEFINITIONS[a.type].title}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {/* Branding */}
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.3 }}
                                transition={{ delay: 2 }}
                                className="text-xs tracking-[0.3em] uppercase"
                            >
                                Auto Memories
                            </motion.p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* COMPLETE PHASE */}
            <AnimatePresence>
                {phase === 'complete' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 flex items-center justify-center z-30"
                    >
                        <div className="text-center">
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-2xl text-white/60 mb-8 tracking-widest"
                            >
                                おわり
                            </motion.p>
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                onClick={handleExit}
                                className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white flex items-center gap-2 mx-auto transition-colors"
                            >
                                ホームに戻る
                                <ChevronRight className="w-4 h-4" />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Controls */}
            <AnimatePresence>
                {showControls && phase !== 'complete' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-0 left-0 right-0 p-4 pb-[8vh] z-50"
                    >
                        <div className="flex items-center justify-between max-w-xl mx-auto">
                            {/* Play/Pause */}
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
                            >
                                {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
                            </button>

                            {/* Phase indicators */}
                            <div className="flex gap-2">
                                {['intro', 'journey', 'credits'].map((p) => (
                                    <div
                                        key={p}
                                        className={`w-2 h-2 rounded-full transition-colors ${p === phase ? 'bg-white' : 'bg-white/20'}`}
                                    />
                                ))}
                            </div>

                            {/* Right controls */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={skipToCredits}
                                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
                                    title="スキップ"
                                >
                                    <SkipForward className="w-5 h-5 text-white" />
                                </button>
                                <button
                                    onClick={() => setIsMuted(!isMuted)}
                                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
                                >
                                    {isMuted ? <VolumeX className="w-5 h-5 text-white" /> : <Volume2 className="w-5 h-5 text-white" />}
                                </button>
                                <button
                                    onClick={handleExit}
                                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
                                    title="キャンセル"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Audio indicator */}
            {!audioReady && (
                <div className="absolute top-[8vh] left-1/2 -translate-x-1/2 z-50">
                    <p className="text-xs text-white/40 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                        タップで音楽再生
                    </p>
                </div>
            )}
        </motion.div>
    );
}
