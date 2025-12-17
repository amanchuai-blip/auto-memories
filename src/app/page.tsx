'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronRight, Trash2, Play, MapPin, Camera } from 'lucide-react';
import { useTrips } from '@/hooks/useTrips';
import { deleteTrip } from '@/lib/db';
import { ACHIEVEMENT_DEFINITIONS } from '@/types';
import { formatDate } from '@/lib/i18n';

export default function HomePage() {
  const { trips, isLoading } = useTrips();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, tripId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('この思い出を削除しますか？')) {
      setDeletingId(tripId);
      await deleteTrip(tripId);
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-pink-900/20" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />

        <div className="relative pt-16 pb-12 px-6">
          <div className="max-w-lg mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 tracking-tight">
                Auto Memories
              </h1>
              <p className="text-white/50 text-lg">
                写真から映画を作ろう
              </p>
            </motion.div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 pb-12 space-y-8">
        {/* Create Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link href="/create">
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="group relative overflow-hidden rounded-3xl"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

              {/* Content */}
              <div className="relative p-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Plus className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white mb-0.5">新しい思い出</h2>
                    <p className="text-white/70 text-sm">写真をアップロードして始める</p>
                  </div>
                  <ChevronRight className="w-6 h-6 text-white/50 group-active:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          </Link>
        </motion.div>

        {/* Trips Section */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider">
              あなたの思い出
            </h2>
            {trips.length > 0 && (
              <span className="text-sm text-white/30">{trips.length}件</span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : trips.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 px-6"
            >
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
                <Camera className="w-10 h-10 text-white/30" />
              </div>
              <p className="text-white/40 text-lg mb-2">まだ思い出がありません</p>
              <p className="text-white/25 text-sm">上のボタンから作成してみましょう</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {trips.map((trip, index) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: deletingId === trip.id ? 0.5 : 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/play/${trip.id}`}>
                      <motion.div
                        whileTap={{ scale: 0.98 }}
                        className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/5 p-4"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                      >
                        <div className="flex items-center gap-4">
                          {/* Preview */}
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                            {trip.achievements.length > 0 ? (
                              <span className="text-2xl">
                                {ACHIEVEMENT_DEFINITIONS[trip.achievements[0].type].icon}
                              </span>
                            ) : (
                              <MapPin className="w-6 h-6 text-white/40" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate mb-1">{trip.name}</h3>
                            <div className="flex items-center gap-3 text-sm text-white/40">
                              <span>{trip.totalPhotos}枚</span>
                              <span className="w-1 h-1 rounded-full bg-white/20" />
                              <span>{trip.totalDistance}km</span>
                              {trip.achievements.length > 0 && (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-white/20" />
                                  <span className="text-purple-400">🏆{trip.achievements.length}</span>
                                </>
                              )}
                            </div>
                            {trip.startDate && (
                              <p className="text-xs text-white/25 mt-1">{formatDate(trip.startDate)}</p>
                            )}
                          </div>

                          {/* Play icon */}
                          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-4 h-4 text-white/60 ml-0.5" />
                          </div>
                        </div>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, trip.id)}
                          className="absolute top-2 right-2 p-2 rounded-full opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all"
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-white/5">
        <p className="text-white/20 text-xs">
          💡 写真の位置情報と時間からストーリーを自動生成します
        </p>
      </footer>
    </main>
  );
}
