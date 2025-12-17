'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Download, Copy, Check, X } from 'lucide-react';
import type { Trip } from '@/types';
import { shareTrip, generateShareImage, downloadShareImage } from '@/lib/share';
import { t } from '@/lib/i18n';
import { playSfx } from '@/lib/sfx';

interface ShareModalProps {
    trip: Trip;
    isOpen: boolean;
    onClose: () => void;
}

export default function ShareModal({ trip, isOpen, onClose }: ShareModalProps) {
    const [shareStatus, setShareStatus] = useState<'idle' | 'sharing' | 'copied' | 'shared' | 'error'>('idle');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGeneratePreview = async () => {
        if (previewUrl) return;
        setIsGenerating(true);
        try {
            const blob = await generateShareImage(trip);
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
        } catch {
            console.error('Failed to generate preview');
        }
        setIsGenerating(false);
    };

    const handleShare = async () => {
        setShareStatus('sharing');
        playSfx('click');

        try {
            let imageBlob: Blob | undefined;
            try {
                imageBlob = await generateShareImage(trip);
            } catch {
                // Continue without image
            }

            const result = await shareTrip(trip, imageBlob);
            if (result === 'shared') {
                setShareStatus('shared');
                playSfx('complete');
            } else if (result === 'copied') {
                setShareStatus('copied');
                playSfx('achievement');
            } else {
                setShareStatus('error');
            }
        } catch {
            setShareStatus('error');
        }

        setTimeout(() => setShareStatus('idle'), 2000);
    };

    const handleDownload = async () => {
        playSfx('click');
        try {
            await downloadShareImage(trip);
            playSfx('complete');
        } catch {
            console.error('Failed to download');
        }
    };

    const handleCopy = async () => {
        playSfx('click');
        const text = `${trip.name} - Auto Memoriesで作成した旅の思い出\n📸 ${trip.totalPhotos}枚の写真\n🗺️ ${trip.totalDistance}km\n🏆 ${trip.achievements.length}個の実績`;

        try {
            await navigator.clipboard.writeText(text);
            setShareStatus('copied');
            playSfx('achievement');
            setTimeout(() => setShareStatus('idle'), 2000);
        } catch {
            setShareStatus('error');
        }
    };

    // Generate preview on open
    if (isOpen && !previewUrl && !isGenerating) {
        handleGeneratePreview();
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-[#1a1a2e] rounded-2xl p-6 max-w-md w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">{t('share.title')}</h2>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X className="w-5 h-5 text-white/60" />
                            </button>
                        </div>

                        {/* Preview */}
                        <div className="mb-6 rounded-xl overflow-hidden bg-black/30 aspect-[1200/630]">
                            {isGenerating ? (
                                <div className="w-full h-full flex items-center justify-center">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"
                                    />
                                </div>
                            ) : previewUrl ? (
                                <img src={previewUrl} alt="Share preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/30">
                                    プレビュー生成中...
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="space-y-3">
                            {/* Share button */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleShare}
                                disabled={shareStatus === 'sharing'}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {shareStatus === 'sharing' ? (
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                    />
                                ) : shareStatus === 'shared' || shareStatus === 'copied' ? (
                                    <>
                                        <Check className="w-5 h-5" />
                                        <span>{shareStatus === 'copied' ? t('share.copied') : 'シェアしました'}</span>
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="w-5 h-5" />
                                        <span>{t('share.shareButton')}</span>
                                    </>
                                )}
                            </motion.button>

                            {/* Secondary actions */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={handleDownload}
                                    className="py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>画像保存</span>
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className="py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Copy className="w-4 h-4" />
                                    <span>コピー</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
