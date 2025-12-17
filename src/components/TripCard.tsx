'use client';

import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, Trash2 } from 'lucide-react';
import type { Trip } from '@/types';
import { ACHIEVEMENT_DEFINITIONS } from '@/types';
import { formatDate, formatDuration } from '@/lib/i18n';

interface TripCardProps {
    trip: Trip;
    onClick?: () => void;
    onDelete?: () => void;
}

export default function TripCard({ trip, onClick, onDelete }: TripCardProps) {
    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete?.();
    };

    // Get first 5 achievement icons
    const achievementIcons = trip.achievements
        .slice(0, 5)
        .map((a) => ACHIEVEMENT_DEFINITIONS[a.type].icon);

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="relative overflow-hidden rounded-xl bg-white/5 border border-white/10 p-4 cursor-pointer group"
        >
            {/* Content */}
            <div className="relative z-10">
                <h3 className="text-lg font-semibold text-white mb-2">{trip.name}</h3>

                <div className="flex flex-wrap items-center gap-4 text-sm text-white/60 mb-3">
                    {trip.startDate && (
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(trip.startDate)}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        <span>{trip.totalDistance} km</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" />
                        <span>{formatDuration(trip.duration)}</span>
                    </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-white/40 text-sm">{trip.totalPhotos}枚</span>
                        {achievementIcons.length > 0 && (
                            <div className="flex items-center gap-1">
                                {achievementIcons.map((icon, i) => (
                                    <span key={i} className="text-lg">{icon}</span>
                                ))}
                                {trip.achievements.length > 5 && (
                                    <span className="text-xs text-white/40 ml-1">+{trip.achievements.length - 5}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete button */}
            {onDelete && (
                <motion.button
                    initial={{ opacity: 0 }}
                    whileHover={{ scale: 1.1 }}
                    onClick={handleDelete}
                    className="absolute top-4 right-4 p-2 rounded-full bg-red-500/20 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Trash2 className="w-4 h-4" />
                </motion.button>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </motion.div>
    );
}
