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
                    className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full"
                />
            </main>
        );
    }

    if (!trip) {
        return (
            <main className="min-h-[100dvh] bg-black flex items-center justify-center">
                <div className="text-center p-8">
                    <p className="text-white text-xl mb-5">見つかりません</p>
                    <button
                        onClick={() => router.push('/')}
                        className="text-violet-400 text-lg"
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
                <div className="px-5 py-4 flex items-center gap-4">
                    <button
                        onClick={() => router.push('/')}
                        className="p-3 -ml-3 rounded-full active:bg-white/10"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold truncate">{trip.name}</h1>
                </div>
            </header>

            <div className="p-5 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-5 bg-white/5 rounded-2xl">
                        <p className="text-3xl font-bold">{trip.totalPhotos}</p>
                        <p className="text-base text-white/50 mt-1">写真</p>
                    </div>
                    <div className="text-center p-5 bg-white/5 rounded-2xl">
                        <p className="text-3xl font-bold">{trip.totalDistance}</p>
                        <p className="text-base text-white/50 mt-1">km</p>
                    </div>
                    <div className="text-center p-5 bg-white/5 rounded-2xl">
                        <p className="text-3xl font-bold">{trip.achievements.length}</p>
                        <p className="text-base text-white/50 mt-1">実績</p>
                    </div>
                </div>

                {/* Achievements preview */}
                {trip.achievements.length > 0 && (
                    <div>
                        <p className="text-base text-white/50 mb-3 font-medium">獲得実績</p>
                        <div className="flex flex-wrap gap-2">
                            {trip.achievements.slice(0, 6).map((a) => (
                                <div
                                    key={a.id}
                                    className="px-4 py-2 bg-white/5 rounded-full flex items-center gap-2"
                                >
                                    <span className="text-xl">{ACHIEVEMENT_DEFINITIONS[a.type].icon}</span>
                                    <span className="text-base">{ACHIEVEMENT_DEFINITIONS[a.type].title}</span>
                                </div>
                            ))}
                            {trip.achievements.length > 6 && (
                                <div className="px-4 py-2 text-white/40 text-base">
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
                    className="w-full py-5 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl font-bold text-xl flex items-center justify-center gap-3"
                >
                    <Play className="w-7 h-7" />
                    再生する
                </motion.button>
            </div>
        </main>
    );
}
