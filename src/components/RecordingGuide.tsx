'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Monitor, Apple } from 'lucide-react';
import { t } from '@/lib/i18n';

interface RecordingGuideProps {
    isOpen: boolean;
    onClose: () => void;
}

type Platform = 'ios' | 'android' | 'windows' | 'macos';

const platformIcons: Record<Platform, React.ReactNode> = {
    ios: <Apple className="w-5 h-5" />,
    android: <Smartphone className="w-5 h-5" />,
    windows: <Monitor className="w-5 h-5" />,
    macos: <Apple className="w-5 h-5" />,
};

export default function RecordingGuide({ isOpen, onClose }: RecordingGuideProps) {
    const platforms: Platform[] = ['ios', 'android', 'windows', 'macos'];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-[#1a1a2e] rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-white mb-1">
                                    {t('recording.title')}
                                </h2>
                                <p className="text-white/60 text-sm">
                                    {t('recording.subtitle')}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5 text-white/60" />
                            </button>
                        </div>

                        {/* Platforms */}
                        <div className="space-y-4">
                            {platforms.map((platform) => (
                                <div
                                    key={platform}
                                    className="bg-white/5 rounded-xl p-4"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                                            {platformIcons[platform]}
                                        </div>
                                        <h3 className="font-semibold text-white">
                                            {t(`recording.platforms.${platform}.name`)}
                                        </h3>
                                    </div>
                                    <ol className="space-y-2 text-sm text-white/70">
                                        {(t(`recording.platforms.${platform}.steps`) as unknown as string[])?.map((step: string, i: number) => (
                                            <li key={i} className="flex gap-3">
                                                <span className="text-purple-400 font-medium">{i + 1}.</span>
                                                <span>{step}</span>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            ))}
                        </div>

                        {/* Tip */}
                        <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                            <p className="text-sm text-white/80">💡 {t('recording.tip')}</p>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="w-full mt-6 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl transition-colors"
                        >
                            {t('recording.gotIt')}
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
