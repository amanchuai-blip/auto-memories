'use client';

import { motion } from 'framer-motion';
import type { Achievement } from '@/types';
import { ACHIEVEMENT_DEFINITIONS } from '@/types';
import { t } from '@/lib/i18n';
import { playSfx } from '@/lib/sfx';
import { useEffect } from 'react';

interface AchievementBadgeProps {
    achievement: Achievement;
    delay?: number;
    size?: 'sm' | 'md' | 'lg';
    showRarity?: boolean;
}

const RARITY_COLORS = {
    common: { bg: 'rgba(148, 163, 184, 0.2)', glow: '#94A3B8', particles: false },
    uncommon: { bg: 'rgba(34, 197, 94, 0.2)', glow: '#22C55E', particles: false },
    rare: { bg: 'rgba(59, 130, 246, 0.2)', glow: '#3B82F6', particles: true },
    epic: { bg: 'rgba(168, 85, 247, 0.2)', glow: '#A855F7', particles: true },
    legendary: { bg: 'rgba(234, 179, 8, 0.2)', glow: '#EAB308', particles: true },
};

export default function AchievementBadge({
    achievement,
    delay = 0,
    size = 'md',
    showRarity = false,
}: AchievementBadgeProps) {
    const definition = ACHIEVEMENT_DEFINITIONS[achievement.type];
    const rarityStyle = RARITY_COLORS[definition.rarity];

    const sizeClasses = {
        sm: 'text-2xl p-2',
        md: 'text-4xl p-4',
        lg: 'text-6xl p-6',
    };

    return (
        <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -180 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20, delay }}
            className="flex flex-col items-center gap-2"
        >
            {/* Badge with rarity glow */}
            <motion.div
                className={`relative rounded-full ${sizeClasses[size]}`}
                style={{
                    background: rarityStyle.bg,
                    boxShadow: `0 0 30px ${rarityStyle.glow}44, 0 0 60px ${rarityStyle.glow}22`,
                }}
                whileHover={{ scale: 1.1 }}
            >
                {/* Animated glow ring for rare+ */}
                {rarityStyle.particles && (
                    <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{ border: `2px solid ${rarityStyle.glow}` }}
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.8, 0, 0.8],
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                )}

                {/* Pulse effect */}
                <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{ background: definition.color }}
                    initial={{ opacity: 0.5, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.5 }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatType: 'loop' }}
                />

                {/* Icon */}
                <span className="relative z-10">{definition.icon}</span>

                {/* Sparkles for legendary */}
                {definition.rarity === 'legendary' && (
                    <>
                        {[...Array(6)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute w-1 h-1 rounded-full bg-yellow-400"
                                style={{
                                    top: '50%',
                                    left: '50%',
                                }}
                                animate={{
                                    x: [0, Math.cos(i * 60 * Math.PI / 180) * 40],
                                    y: [0, Math.sin(i * 60 * Math.PI / 180) * 40],
                                    opacity: [1, 0],
                                    scale: [1, 0.5],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                    ease: 'easeOut',
                                }}
                            />
                        ))}
                    </>
                )}
            </motion.div>

            {/* Title */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: delay + 0.3 }}
                className="text-center"
            >
                <p className="font-bold text-white text-sm">
                    {t(`achievements.${achievement.type}.title`) || definition.title}
                </p>
                <p className="text-white/60 text-xs">
                    {t(`achievements.${achievement.type}.desc`) || definition.description}
                </p>
                {showRarity && (
                    <p
                        className="text-xs mt-1 font-medium"
                        style={{ color: rarityStyle.glow }}
                    >
                        {t(`rarity.${definition.rarity}`)}
                    </p>
                )}
            </motion.div>
        </motion.div>
    );
}

// Grid display for multiple achievements
interface AchievementGridProps {
    achievements: Achievement[];
    staggerDelay?: number;
}

export function AchievementGrid({ achievements, staggerDelay = 0.2 }: AchievementGridProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {achievements.map((achievement, index) => (
                <AchievementBadge
                    key={achievement.id}
                    achievement={achievement}
                    delay={index * staggerDelay}
                    showRarity
                />
            ))}
        </div>
    );
}

// Full-screen overlay for end roll
interface AchievementOverlayProps {
    achievement: Achievement;
    onComplete?: () => void;
}

export function AchievementOverlay({ achievement, onComplete }: AchievementOverlayProps) {
    const definition = ACHIEVEMENT_DEFINITIONS[achievement.type];
    const rarityStyle = RARITY_COLORS[definition.rarity];

    // Play sound effect when showing
    useEffect(() => {
        playSfx('achievement');
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onAnimationComplete={onComplete}
            className="fixed inset-0 flex items-center justify-center z-50"
            style={{ background: `radial-gradient(circle, ${rarityStyle.glow}22 0%, rgba(0,0,0,0.9) 70%)` }}
        >
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                className="text-center space-y-6"
            >
                {/* Achievement unlocked text */}
                <motion.p
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm tracking-[0.3em] uppercase"
                    style={{ color: rarityStyle.glow }}
                >
                    {t('play.endroll.achievementUnlocked')}
                </motion.p>

                {/* Large badge with effects */}
                <motion.div
                    className="relative inline-block"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 150, damping: 15, delay: 0.3 }}
                >
                    {/* Glow ring */}
                    <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{
                            background: `radial-gradient(circle, ${rarityStyle.glow}44 0%, transparent 70%)`,
                            transform: 'scale(2)',
                        }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    />

                    {/* Icon */}
                    <div
                        className="relative z-10 text-8xl p-8 rounded-full"
                        style={{ background: rarityStyle.bg }}
                    >
                        {definition.icon}
                    </div>

                    {/* Particles for rare+ */}
                    {rarityStyle.particles && (
                        <>
                            {[...Array(12)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-2 h-2 rounded-full"
                                    style={{
                                        background: rarityStyle.glow,
                                        top: '50%',
                                        left: '50%',
                                    }}
                                    animate={{
                                        x: [0, Math.cos(i * 30 * Math.PI / 180) * 100],
                                        y: [0, Math.sin(i * 30 * Math.PI / 180) * 100],
                                        opacity: [1, 0],
                                        scale: [1, 0],
                                    }}
                                    transition={{
                                        duration: 1,
                                        delay: 0.5 + i * 0.05,
                                        ease: 'easeOut',
                                    }}
                                />
                            ))}
                        </>
                    )}
                </motion.div>

                {/* Title and description */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <h2 className="text-3xl font-bold mb-2" style={{ color: rarityStyle.glow }}>
                        {t(`achievements.${achievement.type}.title`) || definition.title}
                    </h2>
                    <p className="text-white/70">
                        {t(`achievements.${achievement.type}.desc`) || definition.description}
                    </p>
                    <p className="mt-2 text-sm font-medium" style={{ color: rarityStyle.glow }}>
                        {t(`rarity.${definition.rarity}`)}
                    </p>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}
