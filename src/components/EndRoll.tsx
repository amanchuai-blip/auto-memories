'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import type { Photo, Trip } from '@/types';
import { ACHIEVEMENT_DEFINITIONS } from '@/types';
import { AchievementOverlay } from './AchievementBadge';
import { getAudioPlayer, destroyAudioPlayer } from '@/lib/audioPlayer';
import {
    generatePhotoNarrative,
    calculateSpeed,
    calculateCumulativeDistance,
    getTimeGapLabel,
    generateKenBurnsParams,
} from '@/lib/storyGenerator';
import { Play, Pause, Volume2, VolumeX, X, SkipForward } from 'lucide-react';

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
    const [phase, setPhase] = useState<'intro' | 'journey' | 'achievements' | 'credits' | 'complete'>('intro');
    const [achievementIndex, setAchievementIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Sort photos by timestamp
    const sortedPhotos = useMemo(() =>
        [...photos].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
        [photos]
    );

    const currentPhoto = sortedPhotos[currentIndex];
    const prevPhoto = currentIndex > 0 ? sortedPhotos[currentIndex - 1] : null;

    // Current stats
    const currentSpeed = prevPhoto && currentPhoto ? calculateSpeed(prevPhoto, currentPhoto) : 0;
    const cumulativeDistance = calculateCumulativeDistance(sortedPhotos, currentIndex);
    const currentAltitude = currentPhoto?.altitude || 0;

    // Time gap label
    const timeGapLabel = prevPhoto && currentPhoto ? getTimeGapLabel(prevPhoto, currentPhoto) : null;

    // Narrative
    const narrative = currentPhoto
        ? generatePhotoNarrative(currentPhoto, prevPhoto, currentIndex, sortedPhotos.length)
        : '';

    // Ken Burns params
    const kenBurns = generateKenBurnsParams(currentIndex);

    // Audio setup
    useEffect(() => {
        const player = getAudioPlayer();
        player.initialize().then(() => {
            player.loadAudio('/audio/placeholder-bgm.mp3').catch(() => {
                console.warn('BGM not loaded');
            });
        });
        return () => destroyAudioPlayer();
    }, []);

    // Audio control
    useEffect(() => {
        const player = getAudioPlayer();
        if (isPlaying && !isMuted) {
            player.play();
        } else {
            player.stop();
        }
    }, [isPlaying, isMuted]);

    // Auto-hide controls
    useEffect(() => {
        if (showControls) {
            controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
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
                timeout = setTimeout(() => setPhase('journey'), 4000);
                break;
            case 'journey':
                if (currentIndex < sortedPhotos.length - 1) {
                    // Extra time for time gap transitions
                    const delay = timeGapLabel ? 6000 : 5000;
                    timeout = setTimeout(() => setCurrentIndex(i => i + 1), delay);
                } else {
                    timeout = setTimeout(() => setPhase('achievements'), 2000);
                }
                break;
            case 'achievements':
                if (achievements.length === 0) {
                    setPhase('credits');
                } else if (achievementIndex < achievements.length - 1) {
                    timeout = setTimeout(() => setAchievementIndex(i => i + 1), 3500);
                } else {
                    timeout = setTimeout(() => setPhase('credits'), 3500);
                }
                break;
            case 'credits':
                timeout = setTimeout(() => {
                    setPhase('complete');
                    onComplete?.();
                }, 10000);
                break;
        }

        return () => { if (timeout) clearTimeout(timeout); };
    }, [phase, isPlaying, currentIndex, sortedPhotos.length, timeGapLabel, achievementIndex, achievements.length, onComplete]);

    const handleInteraction = useCallback(() => setShowControls(true), []);

    const skipPhase = useCallback(() => {
        switch (phase) {
            case 'intro': setPhase('journey'); break;
            case 'journey': setPhase('achievements'); break;
            case 'achievements': setPhase('credits'); break;
            case 'credits': setPhase('complete'); onComplete?.(); break;
        }
    }, [phase, onComplete]);

    // Get photo URL
    const photoUrl = currentPhoto ? URL.createObjectURL(currentPhoto.blob) : '';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 overflow-hidden"
            onMouseMove={handleInteraction}
            onTouchStart={handleInteraction}
        >
            {/* Film grain overlay */}
            <div
                className="absolute inset-0 z-50 pointer-events-none opacity-[0.04]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                }}
            />

            {/* Cinematic letterbox */}
            <div className="absolute top-0 left-0 right-0 h-[8vh] bg-black z-40" />
            <div className="absolute bottom-0 left-0 right-0 h-[8vh] bg-black z-40" />

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
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 1 }}
                            >
                                <h1 className="text-4xl md:text-6xl font-light text-white tracking-[0.2em] mb-4">
                                    {trip.name}
                                </h1>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.5 }}
                                transition={{ delay: 1.5, duration: 1 }}
                                className="text-white/50 tracking-[0.3em] uppercase text-sm"
                            >
                                {trip.startDate?.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' })}
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* JOURNEY - Main Content */}
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
                            {/* Map darkening overlay */}
                            <div className="absolute inset-0 bg-black/40" />
                        </div>

                        {/* Time Gap Transition */}
                        <AnimatePresence>
                            {timeGapLabel && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.8 }}
                                    className="absolute inset-0 flex items-center justify-center z-30 bg-black/60"
                                >
                                    <motion.p
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-3xl md:text-5xl font-light text-white tracking-[0.2em]"
                                    >
                                        {timeGapLabel}
                                    </motion.p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Photo PiP with Ken Burns */}
                        <motion.div
                            key={currentPhoto.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.8 }}
                            className="absolute right-[5%] top-[15%] w-[55%] md:w-[45%] aspect-[4/3] rounded-lg overflow-hidden shadow-2xl z-25"
                            style={{
                                boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
                            }}
                        >
                            {/* Ken Burns container */}
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
                                transition={{ duration: 5, ease: 'linear' }}
                                className="w-full h-full"
                            >
                                <img
                                    src={photoUrl}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    style={{
                                        filter: 'contrast(1.05) saturate(1.1)',
                                    }}
                                />
                            </motion.div>

                            {/* Photo vignette */}
                            <div
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                    background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)',
                                }}
                            />
                        </motion.div>

                        {/* Narrative Text */}
                        <motion.div
                            key={`narrative-${currentIndex}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.6 }}
                            className="absolute left-[5%] bottom-[18%] max-w-[40%] z-25"
                        >
                            <p className="text-xl md:text-2xl font-light text-white leading-relaxed drop-shadow-lg">
                                {narrative}
                            </p>
                            <p className="text-white/40 text-sm mt-2 tracking-wider">
                                {currentPhoto.timestamp.toLocaleString('ja-JP', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </motion.div>

                        {/* Stats Overlay */}
                        <div className="absolute left-[5%] top-[15%] z-25 space-y-4">
                            {/* Distance */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3"
                            >
                                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                    <span className="text-lg">🗺️</span>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-white">{cumulativeDistance} km</p>
                                    <p className="text-xs text-white/50 uppercase tracking-wider">距離</p>
                                </div>
                            </motion.div>

                            {/* Speed */}
                            {currentSpeed > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                        <span className="text-lg">⚡</span>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-white">{currentSpeed} km/h</p>
                                        <p className="text-xs text-white/50 uppercase tracking-wider">速度</p>
                                    </div>
                                </motion.div>
                            )}

                            {/* Altitude */}
                            {currentAltitude > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                                        <span className="text-lg">⛰️</span>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-white">{Math.round(currentAltitude)} m</p>
                                        <p className="text-xs text-white/50 uppercase tracking-wider">標高</p>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Progress indicator */}
                        <div className="absolute bottom-[10%] left-[5%] right-[5%] z-25">
                            <div className="h-0.5 bg-white/20 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-white/60"
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${((currentIndex + 1) / sortedPhotos.length) * 100}%` }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                            <p className="text-xs text-white/40 mt-2 text-center">
                                {currentIndex + 1} / {sortedPhotos.length}
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ACHIEVEMENTS */}
            <AnimatePresence>
                {phase === 'achievements' && achievements[achievementIndex] && (
                    <AchievementOverlay achievement={achievements[achievementIndex]} />
                )}
            </AnimatePresence>

            {/* CREDITS */}
            <AnimatePresence>
                {phase === 'credits' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center z-30 overflow-hidden"
                    >
                        <motion.div
                            className="text-center space-y-12"
                            initial={{ y: '50%' }}
                            animate={{ y: '-50%' }}
                            transition={{ duration: 12, ease: 'linear' }}
                        >
                            <div className="h-[50vh]" />

                            <h2 className="text-5xl font-light text-white tracking-wide">
                                {trip.name}
                            </h2>

                            <div className="grid grid-cols-3 gap-12 text-white">
                                <div>
                                    <p className="text-4xl font-bold">{trip.totalPhotos}</p>
                                    <p className="text-sm text-white/50 uppercase tracking-wider mt-2">写真</p>
                                </div>
                                <div>
                                    <p className="text-4xl font-bold">{trip.totalDistance} km</p>
                                    <p className="text-sm text-white/50 uppercase tracking-wider mt-2">総距離</p>
                                </div>
                                <div>
                                    <p className="text-4xl font-bold">{achievements.length}</p>
                                    <p className="text-sm text-white/50 uppercase tracking-wider mt-2">実績</p>
                                </div>
                            </div>

                            {achievements.length > 0 && (
                                <div className="flex justify-center gap-4 flex-wrap max-w-md mx-auto">
                                    {achievements.map((a) => (
                                        <span key={a.id} className="text-3xl">
                                            {ACHIEVEMENT_DEFINITIONS[a.type].icon}
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="text-white/30 text-sm tracking-[0.3em] uppercase pt-12">
                                Auto Memories
                            </div>

                            <div className="h-[50vh]" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* COMPLETE */}
            <AnimatePresence>
                {phase === 'complete' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 flex items-center justify-center z-30"
                    >
                        <div className="text-center">
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-2xl text-white/80 mb-8 tracking-widest"
                            >
                                おわり
                            </motion.p>
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                onClick={onExit}
                                className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                            >
                                ホームに戻る
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Controls */}
            <AnimatePresence>
                {showControls && phase !== 'complete' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-x-0 bottom-0 p-6 pb-[10vh] z-50"
                    >
                        <div className="flex items-center justify-between max-w-2xl mx-auto">
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
                            >
                                {isPlaying ? <Pause className="w-6 h-6 text-white" /> : <Play className="w-6 h-6 text-white" />}
                            </button>

                            <div className="flex gap-2">
                                {(['intro', 'journey', 'achievements', 'credits'] as const).map((p) => (
                                    <div
                                        key={p}
                                        className={`w-2 h-2 rounded-full ${p === phase ? 'bg-white' : 'bg-white/30'}`}
                                    />
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={skipPhase}
                                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
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
                                    onClick={onExit}
                                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
