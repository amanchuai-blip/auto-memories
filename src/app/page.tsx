'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronRight, Trash2 } from 'lucide-react';
import { useTrips } from '@/hooks/useTrips';
import { deleteTrip } from '@/lib/db';
import { ACHIEVEMENT_DEFINITIONS } from '@/types';
import { formatDate, formatDuration } from '@/lib/i18n';

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
      {/* Header */}
      <header className="pt-12 pb-6 px-4">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-white mb-1">Auto Memories</h1>
            <p className="text-white/50">旅の写真を思い出に</p>
          </motion.div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pb-8 space-y-6">
        {/* Create button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link href="/create">
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden rounded-3xl p-6"
              style={{
                background: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Plus className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">新しい思い出を作る</h2>
                  <p className="text-white/70 text-sm">写真からエンドロールを生成</p>
                </div>
                <ChevronRight className="w-6 h-6 text-white/60" />
              </div>
            </motion.div>
          </Link>
        </motion.div>

        {/* Past trips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-3 px-1">
            過去の思い出
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-16 px-6 rounded-3xl bg-white/[0.03] border border-white/5">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <span className="text-3xl">📷</span>
              </div>
              <p className="text-white/50">まだ思い出がありません</p>
              <p className="text-white/30 text-sm mt-1">最初の思い出を作成しましょう</p>
            </div>
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
                        className="group relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/5 p-4 active:bg-white/[0.06] transition-colors"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                      >
                        <div className="flex items-center gap-4">
                          {/* Achievement icons preview */}
                          <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                            {trip.achievements.length > 0 ? (
                              <span className="text-2xl">
                                {ACHIEVEMENT_DEFINITIONS[trip.achievements[0].type].icon}
                              </span>
                            ) : (
                              <span className="text-2xl">🗺️</span>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate">{trip.name}</h3>
                            <div className="flex items-center gap-3 text-sm text-white/40 mt-1">
                              <span>{trip.totalPhotos}枚</span>
                              <span>•</span>
                              <span>{trip.totalDistance}km</span>
                              {trip.achievements.length > 0 && (
                                <>
                                  <span>•</span>
                                  <span>🏆 {trip.achievements.length}</span>
                                </>
                              )}
                            </div>
                            {trip.startDate && (
                              <p className="text-xs text-white/30 mt-1">
                                {formatDate(trip.startDate)}
                              </p>
                            )}
                          </div>

                          <ChevronRight className="w-5 h-5 text-white/20 shrink-0" />
                        </div>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, trip.id)}
                          className="absolute top-3 right-3 p-2 rounded-full bg-red-500/0 active:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-all"
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
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-white/20 text-xs">
          💡 スクリーン録画で動画として保存できます
        </p>
      </footer>
    </main>
  );
}
