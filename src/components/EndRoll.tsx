'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import type { Photo, Achievement, RoutePoint, Trip } from '@/types';
import { ACHIEVEMENT_DEFINITIONS } from '@/types';
import PhotoSlide from './PhotoSlide';
import { AchievementOverlay } from './AchievementBadge';
import { getAudioPlayer, destroyAudioPlayer } from '@/lib/audioPlayer';
import { Play, Pause, Volume2, VolumeX, X, SkipForward } from 'lucide-react';

// Dynamic import for MapView to avoid SSR issues with Leaflet
const MapView = dynamic(() => import('./MapView'), { ssr: false });

interface EndRollProps {
    trip: Trip;
    photos: Photo[];
    onComplete?: () => void;
    onExit?: () => void;
}

type Phase = 'intro' | 'map' | 'photos' | 'achievements' | 'credits' | 'complete';

export default function EndRoll({
    trip,
    photos,
    onComplete,
    onExit,
}: EndRollProps) {
    const route = trip.route;
    const achievements = trip.achievements;
    const [phase, setPhase] = useState<Phase>('intro');
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [currentAchievementIndex, setCurrentAchievementIndex] = useState(0);
    const [mapPointIndex, setMapPointIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize audio
    useEffect(() => {
        const player = getAudioPlayer();
        player.initialize().then(() => {
            // Try to load audio from public folder
            player.loadAudio('/audio/placeholder-bgm.mp3').catch(() => {
                console.warn('BGM not loaded, continuing without audio');
            });
        });

        return () => {
            destroyAudioPlayer();
        };
    }, []);

    // Play/pause audio based on state
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
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
            }, 3000);
        }
        return () => {
            if (controlsTimeoutRef.current) {
                clearTimeout(controlsTimeoutRef.current);
            }
        };
    }, [showControls]);

    // Handle phase transitions
    useEffect(() => {
        if (!isPlaying) return;

        let timeout: NodeJS.Timeout;

        switch (phase) {
            case 'intro':
                timeout = setTimeout(() => setPhase('map'), 3000);
                break;
            case 'map':
                if (mapPointIndex < route.length - 1) {
                    timeout = setTimeout(() => setMapPointIndex((i) => i + 1), 2500);
                } else {
                    timeout = setTimeout(() => setPhase('photos'), 1500);
                }
                break;
            case 'photos':
                if (currentPhotoIndex < photos.length - 1) {
                    timeout = setTimeout(() => setCurrentPhotoIndex((i) => i + 1), 4000);
                } else {
                    timeout = setTimeout(() => setPhase('achievements'), 1000);
                }
                break;
            case 'achievements':
                if (achievements.length === 0) {
                    setPhase('credits');
                } else if (currentAchievementIndex < achievements.length - 1) {
                    timeout = setTimeout(() => setCurrentAchievementIndex((i) => i + 1), 3000);
                } else {
                    timeout = setTimeout(() => setPhase('credits'), 3000);
                }
                break;
            case 'credits':
                timeout = setTimeout(() => {
                    setPhase('complete');
                    onComplete?.();
                }, 8000);
                break;
        }

        return () => {
            if (timeout) clearTimeout(timeout);
        };
    }, [phase, isPlaying, mapPointIndex, route.length, currentPhotoIndex, photos.length, currentAchievementIndex, achievements.length, onComplete]);

    const handleMouseMove = useCallback(() => {
        setShowControls(true);
    }, []);

    const skipPhase = useCallback(() => {
        switch (phase) {
            case 'intro':
                setPhase('map');
                break;
            case 'map':
                setPhase('photos');
                break;
            case 'photos':
                setPhase('achievements');
                break;
            case 'achievements':
                setPhase('credits');
                break;
            case 'credits':
                setPhase('complete');
                onComplete?.();
                break;
        }
    }, [phase, onComplete]);

    // Format duration
    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes} minutes`;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-50 overflow-hidden"
            onMouseMove={handleMouseMove}
            onTouchStart={handleMouseMove}
        >
            {/* Background layer - Map */}
            <AnimatePresence>
                {(phase === 'map' || phase === 'photos') && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: phase === 'map' ? 1 : 0.3 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0"
                    >
                        <MapView
                            route={route}
                            isAnimating={phase === 'map' && isPlaying}
                            currentPointIndex={mapPointIndex}
                            className="w-full h-full"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Intro phase */}
            <AnimatePresence>
                {phase === 'intro' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <div className="text-center">
                            <motion.h1
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="text-5xl md:text-7xl font-light text-white mb-4 tracking-wide"
                            >
                                {trip.name}
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.6 }}
                                transition={{ delay: 1 }}
                                className="text-white/60 text-lg tracking-widest"
                            >
                                {trip.startDate?.toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long'
                                })}
                            </motion.p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Photos phase */}
            <AnimatePresence>
                {phase === 'photos' && photos.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0"
                    >
                        <PhotoSlide
                            photos={photos}
                            currentIndex={currentPhotoIndex}
                            className="w-full h-full"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Achievements phase */}
            <AnimatePresence>
                {phase === 'achievements' && achievements[currentAchievementIndex] && (
                    <AchievementOverlay
                        achievement={achievements[currentAchievementIndex]}
                    />
                )}
            </AnimatePresence>

            {/* Credits phase */}
            <AnimatePresence>
                {phase === 'credits' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center overflow-hidden"
                    >
                        <motion.div
                            className="text-center space-y-8"
                            initial={{ y: '100%' }}
                            animate={{ y: '-100%' }}
                            transition={{ duration: 15, ease: 'linear' }}
                        >
                            <div className="h-screen" /> {/* Spacer */}

                            <h2 className="text-4xl font-light text-white tracking-wide mb-12">
                                {trip.name}
                            </h2>

                            <div className="space-y-6 text-white/80">
                                <div>
                                    <p className="text-white/50 text-sm uppercase tracking-wider mb-1">Photos</p>
                                    <p className="text-2xl">{trip.totalPhotos}</p>
                                </div>
                                <div>
                                    <p className="text-white/50 text-sm uppercase tracking-wider mb-1">Distance</p>
                                    <p className="text-2xl">{trip.totalDistance} km</p>
                                </div>
                                <div>
                                    <p className="text-white/50 text-sm uppercase tracking-wider mb-1">Duration</p>
                                    <p className="text-2xl">{formatDuration(trip.duration)}</p>
                                </div>
                            </div>

                            {achievements.length > 0 && (
                                <div className="pt-12">
                                    <p className="text-white/50 text-sm uppercase tracking-wider mb-6">Achievements</p>
                                    <div className="flex flex-wrap justify-center gap-4">
                                        {achievements.map((a) => (
                                            <div key={a.id} className="text-center">
                                                <span className="text-3xl">{ACHIEVEMENT_DEFINITIONS[a.type].icon}</span>
                                                <p className="text-xs text-white/60 mt-1">
                                                    {ACHIEVEMENT_DEFINITIONS[a.type].title}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-12 text-white/40 text-sm">
                                <p>Created with Auto Memories</p>
                                <p className="mt-2">🎬</p>
                            </div>

                            <div className="h-screen" /> {/* Spacer */}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Complete phase */}
            <AnimatePresence>
                {phase === 'complete' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 flex items-center justify-center"
                    >
                        <div className="text-center">
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-2xl text-white/80 mb-6"
                            >
                                The End
                            </motion.p>
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                onClick={onExit}
                                className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                            >
                                Back to Home
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Controls overlay */}
            <AnimatePresence>
                {showControls && phase !== 'complete' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent"
                    >
                        <div className="flex items-center justify-between max-w-2xl mx-auto">
                            {/* Play/Pause */}
                            <button
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                {isPlaying ? (
                                    <Pause className="w-6 h-6 text-white" />
                                ) : (
                                    <Play className="w-6 h-6 text-white" />
                                )}
                            </button>

                            {/* Phase indicator */}
                            <div className="flex gap-2">
                                {(['intro', 'map', 'photos', 'achievements', 'credits'] as Phase[]).map((p) => (
                                    <div
                                        key={p}
                                        className={`w-2 h-2 rounded-full ${p === phase ? 'bg-white' : 'bg-white/30'
                                            }`}
                                    />
                                ))}
                            </div>

                            {/* Right controls */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={skipPhase}
                                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                                >
                                    <SkipForward className="w-5 h-5 text-white" />
                                </button>
                                <button
                                    onClick={() => setIsMuted(!isMuted)}
                                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                                >
                                    {isMuted ? (
                                        <VolumeX className="w-5 h-5 text-white" />
                                    ) : (
                                        <Volume2 className="w-5 h-5 text-white" />
                                    )}
                                </button>
                                <button
                                    onClick={onExit}
                                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
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
