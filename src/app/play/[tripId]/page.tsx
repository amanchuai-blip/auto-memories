'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Video, Share2 } from 'lucide-react';
import { useTrip } from '@/hooks/useTrips';
import EndRoll from '@/components/EndRoll';
import RecordingGuide from '@/components/RecordingGuide';
import ShareModal from '@/components/ShareModal';
import { AchievementGrid } from '@/components/AchievementBadge';
import { ACHIEVEMENT_DEFINITIONS } from '@/types';
import { t, formatDuration, formatDateRange } from '@/lib/i18n';
import { initSfx } from '@/lib/sfx';

interface PlayPageProps {
    params: Promise<{ tripId: string }>;
}

export default function PlayPage({ params }: PlayPageProps) {
    const { tripId } = use(params);
    const router = useRouter();
    const { trip, photos, isLoading } = useTrip(tripId);
    const [showEndRoll, setShowEndRoll] = useState(false);
    const [showRecordingGuide, setShowRecordingGuide] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);

    const handlePlay = async () => {
        await initSfx();
        setShowEndRoll(true);
    };

    if (isLoading) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"
                />
            </main>
        );
    }

    if (!trip) {
        return (
            <main className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">旅が見つかりません</h1>
                    <button
                        onClick={() => router.push('/')}
                        className="text-purple-400 hover:text-purple-300 transition-colors"
                    >
                        {t('play.endroll.backToHome')}
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
        <main className="min-h-screen pb-24">
            {/* Header */}
            <header className="p-6 pt-12">
                <div className="max-w-2xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => router.push('/')}
                            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            <span>{t('play.back')}</span>
                        </button>

                        {/* Share button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowShareModal(true)}
                            className="p-3 rounded-full bg-white/10 hover:bg-white/15 transition-colors"
                        >
                            <Share2 className="w-5 h-5 text-white" />
                        </motion.button>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-3xl font-bold text-white mb-2">{trip.name}</h1>
                        {trip.startDate && trip.endDate && (
                            <p className="text-white/60">
                                {formatDateRange(trip.startDate, trip.endDate)}
                            </p>
                        )}
                    </motion.div>
                </div>
            </header>

            <div className="px-6 max-w-2xl mx-auto space-y-8">
                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="grid grid-cols-3 gap-4"
                >
                    <div className="text-center p-4 bg-white/5 rounded-xl">
                        <p className="text-3xl font-bold text-white">{trip.totalPhotos}</p>
                        <p className="text-sm text-white/50">{t('play.stats.photos')}</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-xl">
                        <p className="text-3xl font-bold text-white">{trip.totalDistance}</p>
                        <p className="text-sm text-white/50">{t('play.stats.distance')}</p>
                    </div>
                    <div className="text-center p-4 bg-white/5 rounded-xl">
                        <p className="text-3xl font-bold text-white">{formatDuration(trip.duration)}</p>
                        <p className="text-sm text-white/50">{t('play.stats.duration')}</p>
                    </div>
                </motion.div>

                {/* Play button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handlePlay}
                        className="w-full py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl flex items-center justify-center gap-3 text-lg"
                    >
                        <Play className="w-6 h-6" />
                        <span>{t('play.playButton')}</span>
                    </motion.button>
                </motion.div>

                {/* Recording guide button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <button
                        onClick={() => setShowRecordingGuide(true)}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl flex items-center justify-center gap-3 transition-colors"
                    >
                        <Video className="w-5 h-5 text-white/60" />
                        <span className="text-white/80">{t('play.howToSave')}</span>
                    </button>
                </motion.div>

                {/* Achievements */}
                {trip.achievements.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <h2 className="text-lg font-semibold text-white mb-4">
                            {t('play.achievementsEarned')} ({trip.achievements.length})
                        </h2>
                        <AchievementGrid achievements={trip.achievements} staggerDelay={0.1} />
                    </motion.div>
                )}
            </div>

            {/* Recording guide modal */}
            <RecordingGuide
                isOpen={showRecordingGuide}
                onClose={() => setShowRecordingGuide(false)}
            />

            {/* Share modal */}
            <ShareModal
                trip={trip}
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
            />
        </main>
    );
}
