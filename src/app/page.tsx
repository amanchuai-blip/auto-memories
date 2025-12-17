'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Play, Trash2 } from 'lucide-react';
import { useTrips } from '@/hooks/useTrips';
import { deleteTrip } from '@/lib/db';
import { ACHIEVEMENT_DEFINITIONS } from '@/types';

export default function HomePage() {
  const { trips, isLoading } = useTrips();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, tripId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('削除しますか？')) {
      setDeletingId(tripId);
      await deleteTrip(tripId);
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-lg border-b border-white/5">
        <div className="px-5 py-5">
          <h1 className="text-2xl font-bold">Auto Memories</h1>
          <p className="text-base text-white/50 mt-1">写真から映画を作る</p>
        </div>
      </header>

      <div className="p-5 pb-24 space-y-8">
        {/* Create Button */}
        <Link href="/create">
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-6"
          >
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                <Plus className="w-8 h-8" />
              </div>
              <div>
                <p className="font-bold text-xl">新しい旅の記録</p>
                <p className="text-white/80 text-base mt-1">写真をアップロード</p>
              </div>
            </div>
          </motion.div>
        </Link>

        {/* Trips */}
        <div>
          <p className="text-base text-white/50 mb-4 font-medium">過去の記録</p>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-20 rounded-2xl border border-dashed border-white/10">
              <p className="text-5xl mb-4">📷</p>
              <p className="text-white/50 text-lg">まだ記録がありません</p>
              <p className="text-white/30 text-base mt-2">上のボタンから作成</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {trips.map((trip, i) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: deletingId === trip.id ? 0.5 : 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={`/play/${trip.id}`}>
                      <div className="relative group rounded-2xl bg-white/5 active:bg-white/10 p-5 flex items-center gap-5 transition-colors">
                        {/* Icon */}
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center text-3xl shrink-0">
                          {trip.achievements[0]
                            ? ACHIEVEMENT_DEFINITIONS[trip.achievements[0].type].icon
                            : '🎬'}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-lg truncate">{trip.name}</p>
                          <p className="text-base text-white/50 mt-1">
                            {trip.totalPhotos}枚 • {trip.totalDistance}km
                            {trip.achievements.length > 0 && ` • 🏆${trip.achievements.length}`}
                          </p>
                        </div>

                        {/* Play */}
                        <Play className="w-6 h-6 text-white/40" />

                        {/* Delete */}
                        <button
                          onClick={(e) => handleDelete(e, trip.id)}
                          className="absolute -top-2 -right-2 p-2.5 rounded-full bg-red-500 opacity-0 group-active:opacity-100 md:group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
