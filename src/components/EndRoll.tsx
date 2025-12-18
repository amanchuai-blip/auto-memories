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

type Phase = 'grid' | 'journey' | 'montage' | 'credits' | 'afterglow';

export default function EndRoll({ trip, photos, onComplete, onExit }: EndRollProps) {
    const route = trip.route;
    const achievements = trip.achievements;

    const [phase, setPhase] = useState<Phase>('grid');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [montageIndex, setMontageIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const [gridZoomTarget, setGridZoomTarget] = useState<number | null>(null);
    const [creditsFinished, setCreditsFinished] = useState(false);
    const [afterglowPhotoIndex, setAfterglowPhotoIndex] = useState(0);
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

    // Audio - random BGM from 7 tracks
    useEffect(() => {
        const bgmTracks = [
            '/audio/bgm.mp3',
            '/audio/bgm1.mp3',
            '/audio/bgm2.mp3',
            '/audio/bgm3.mp3',
            '/audio/bgm4.mp3',
            '/audio/bgm5.mp3',
            '/audio/bgm6.mp3',
        ];
        const randomTrack = bgmTracks[Math.floor(Math.random() * bgmTracks.length)];

        const init = () => {
            if (audioRef.current) return;
            const audio = new Audio(randomTrack);
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
                    setTimeout(() => setPhase('journey'), 2000);
                }, 8000);
                break;
            case 'journey':
                if (currentIndex < sortedPhotos.length - 1) {
                    timeout = setTimeout(() => setCurrentIndex(i => i + 1), 4000);
                } else {
                    timeout = setTimeout(() => setPhase('montage'), 800);
                }
                break;
            case 'montage':
                if (montageIndex < sortedPhotos.length - 1) {
                    timeout = setTimeout(() => setMontageIndex(i => i + 1), 200);
                } else {
                    timeout = setTimeout(() => setPhase('credits'), 500);
                }
                break;
            case 'credits':
                timeout = setTimeout(() => {
                    setCreditsFinished(true);
                    setPhase('afterglow');
                }, 22000);
                break;
            case 'afterglow':
                // Slowly cycle through photos in background
                timeout = setTimeout(() => {
                    setAfterglowPhotoIndex(i => (i + 1) % sortedPhotos.length);
                }, 3000);
                break;
        }

        return () => clearTimeout(timeout);
    }, [phase, isPlaying, currentIndex, montageIndex, sortedPhotos.length, onComplete]);

    const handleExit = useCallback(() => {
        if (audioRef.current) audioRef.current.pause();
        onExit?.();
    }, [onExit]);

    // Format duration
    const formatDuration = () => {
        const duration = Math.round(trip.duration / 60); // seconds -> minutes
        if (duration < 60) return `${duration}分`;
        const hours = Math.floor(duration / 60);
        const mins = duration % 60;
        return mins > 0 ? `${hours}時間${mins}分` : `${hours}時間`;
    };

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
                zIndex: 10001,
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
                        <div style={{ height: '25%', minHeight: '140px', position: 'relative' }}>
                            <MapView
                                route={route}
                                isAnimating={isPlaying}
                                currentPointIndex={Math.min(currentIndex, route.length - 1)}
                                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
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

                        {/* Photo Container */}
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

            {/* CREDITS Phase - Hollywood Style Scrolling */}
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
                            backgroundColor: 'black',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Scrolling credits container */}
                        <motion.div
                            initial={{ y: '60%' }}
                            animate={{ y: '-180%' }}
                            transition={{ duration: 22, ease: 'linear' }}
                            style={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                top: '60%',
                                textAlign: 'center',
                                padding: '0 32px',
                            }}
                        >
                            {/* Title */}
                            <div style={{ marginBottom: '80px' }}>
                                <p style={{
                                    fontSize: '14px',
                                    color: 'rgba(255,255,255,0.5)',
                                    letterSpacing: '4px',
                                    marginBottom: '16px',
                                }}>
                                    A JOURNEY FILM
                                </p>
                                <h1 style={{
                                    fontSize: '36px',
                                    fontWeight: '300',
                                    color: 'white',
                                    letterSpacing: '2px',
                                }}>
                                    {trip.name}
                                </h1>
                            </div>

                            {/* Stats section */}
                            <div style={{ marginBottom: '60px' }}>
                                <p style={{
                                    fontSize: '12px',
                                    color: 'rgba(255,255,255,0.4)',
                                    letterSpacing: '3px',
                                    marginBottom: '24px',
                                }}>
                                    記録
                                </p>
                                <p style={{ fontSize: '20px', color: 'white', marginBottom: '12px' }}>
                                    撮影枚数　{trip.totalPhotos}枚
                                </p>
                                <p style={{ fontSize: '20px', color: 'white', marginBottom: '12px' }}>
                                    移動距離　{trip.totalDistance > 0 ? `${trip.totalDistance}キロメートル` : '計測不可（GPS情報なし）'}
                                </p>
                                <p style={{ fontSize: '20px', color: 'white' }}>
                                    旅の時間　{formatDuration()}
                                </p>
                            </div>

                            {/* Achievements section - Japanese text only, no emoji */}
                            {achievements.length > 0 && (
                                <div style={{ marginBottom: '60px' }}>
                                    <p style={{
                                        fontSize: '12px',
                                        color: 'rgba(255,255,255,0.4)',
                                        letterSpacing: '3px',
                                        marginBottom: '24px',
                                    }}>
                                        獲得した称号
                                    </p>
                                    {achievements.map((a) => (
                                        <p
                                            key={a.id}
                                            style={{
                                                fontSize: '18px',
                                                color: 'white',
                                                marginBottom: '12px',
                                            }}
                                        >
                                            {ACHIEVEMENT_DEFINITIONS[a.type].title}
                                        </p>
                                    ))}
                                </div>
                            )}

                            {/* Date */}
                            <div style={{ marginBottom: '60px' }}>
                                <p style={{
                                    fontSize: '12px',
                                    color: 'rgba(255,255,255,0.4)',
                                    letterSpacing: '3px',
                                    marginBottom: '24px',
                                }}>
                                    撮影期間
                                </p>
                                <p style={{ fontSize: '18px', color: 'white' }}>
                                    {trip.startDate ? trip.startDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                                    {trip.startDate && trip.endDate && trip.startDate.toDateString() !== trip.endDate.toDateString() && (
                                        <> ー {trip.endDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</>
                                    )}
                                </p>
                            </div>

                            {/* Credits */}
                            <div style={{ marginBottom: '80px' }}>
                                <p style={{
                                    fontSize: '12px',
                                    color: 'rgba(255,255,255,0.4)',
                                    letterSpacing: '3px',
                                    marginBottom: '24px',
                                }}>
                                    CREATED WITH
                                </p>
                                <p style={{ fontSize: '24px', color: 'white', fontWeight: '300' }}>
                                    Auto Memories
                                </p>
                            </div>

                            {/* Thank you */}
                            <div>
                                <p style={{
                                    fontSize: '16px',
                                    color: 'rgba(255,255,255,0.6)',
                                    fontStyle: 'italic',
                                }}>
                                    この旅の思い出を写真に残してくれてありがとう
                                </p>
                            </div>
                        </motion.div>

                        {/* Fade gradients */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '150px',
                            background: 'linear-gradient(to bottom, black 0%, transparent 100%)',
                            pointerEvents: 'none',
                        }} />
                        <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '150px',
                            background: 'linear-gradient(to top, black 0%, transparent 100%)',
                            pointerEvents: 'none',
                        }} />

                        {/* Exit button - only show after credits finished */}
                        {creditsFinished && (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                onClick={handleExit}
                                style={{
                                    position: 'absolute',
                                    bottom: '40px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    padding: '16px 48px',
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                    border: '1px solid rgba(255,255,255,0.4)',
                                    borderRadius: '30px',
                                    color: 'white',
                                    fontSize: '18px',
                                    cursor: 'pointer',
                                    zIndex: 20,
                                }}
                            >
                                おわり
                            </motion.button>
                        )}
                    </motion.div>
                )}

                {/* Afterglow Phase - Photos in background */}
                {phase === 'afterglow' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'black',
                            overflow: 'hidden',
                            zIndex: 50,
                        }}
                    >
                        {/* Background photo slideshow */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={afterglowPhotoIndex}
                                initial={{ opacity: 0, scale: 1.05 }}
                                animate={{ opacity: 0.4, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 2 }}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundImage: `url(${photoUrls[afterglowPhotoIndex]})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                }}
                            />
                        </AnimatePresence>

                        {/* Gradient overlay */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'radial-gradient(ellipse at center, transparent 0%, black 80%)',
                        }} />

                        {/* Trip name in center */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            style={{
                                position: 'absolute',
                                top: '40%',
                                left: 0,
                                right: 0,
                                textAlign: 'center',
                            }}
                        >
                            <p style={{
                                fontSize: '14px',
                                color: 'rgba(255,255,255,0.5)',
                                letterSpacing: '4px',
                                marginBottom: '16px',
                            }}>
                                Thank you for watching
                            </p>
                            <h1 style={{
                                fontSize: '28px',
                                fontWeight: '300',
                                color: 'white',
                                letterSpacing: '2px',
                            }}>
                                {trip.name}
                            </h1>
                        </motion.div>

                        {/* Exit button */}
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1 }}
                            onClick={handleExit}
                            style={{
                                position: 'absolute',
                                bottom: '60px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                padding: '18px 60px',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                borderRadius: '30px',
                                color: 'white',
                                fontSize: '18px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                zIndex: 20,
                            }}
                        >
                            おわり
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
