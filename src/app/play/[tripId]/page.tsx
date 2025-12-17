'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Play } from 'lucide-react';
import { useTrip } from '@/hooks/useTrips';
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

    if (isLoading) {
        return (
            <main className="min-h-[100dvh] bg-black flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full"
                />
            </main>
        );
    }

    if (!trip) {
        return (
            <main className="min-h-[100dvh] bg-black flex items-center justify-center">
                <div className="text-center p-6">
                    <p className="text-white text-lg mb-4">見つかりません</p>
                    <button
                        onClick={() => router.push('/')}
                        className="text-violet-400"
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
        <main className="min-h-[100dvh] bg-black text-white">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-lg border-b border-white/5">
                <div className="px-4 py-3 flex items-center gap-3">
                    <button
                        onClick={() => router.push('/')}
                        className="p-2 -ml-2 rounded-full active:bg-white/10"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="font-semibold truncate">{trip.name}</h1>
                </div>
            </header>

            <div className="p-4 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-4 bg-white/5 rounded-xl">
                        <p className="text-2xl font-bold">{trip.totalPhotos}</p>
                        <p className="text-xs text-white/40">写真</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-xl">
                        <p className="text-2xl font-bold">{trip.totalDistance}</p>
                        <p className="text-xs text-white/40">km</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-xl">
                        <p className="text-2xl font-bold">{trip.achievements.length}</p>
                        <p className="text-xs text-white/40">実績</p>
                    </div>
                </div>

                {/* Achievements preview */}
                {trip.achievements.length > 0 && (
                    <div>
                        <p className="text-xs text-white/40 mb-2">獲得実績</p>
                        <div className="flex flex-wrap gap-2">
                            {trip.achievements.slice(0, 6).map((a) => (
                                <div
                                    key={a.id}
                                    className="px-3 py-1.5 bg-white/5 rounded-full flex items-center gap-1.5"
                                >
                                    <span>{ACHIEVEMENT_DEFINITIONS[a.type].icon}</span>
                                    <span className="text-xs">{ACHIEVEMENT_DEFINITIONS[a.type].title}</span>
                                </div>
                            ))}
                            {trip.achievements.length > 6 && (
                                <div className="px-3 py-1.5 text-white/40 text-xs">
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
                    className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-semibold text-lg flex items-center justify-center gap-3"
                >
                    <Play className="w-6 h-6" />
                    再生
                </motion.button>
            </div>
        </main>
    );
}
