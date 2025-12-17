'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
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
    if (confirm('この記録を消去しますか？')) {
      setDeletingId(tripId);
      await deleteTrip(tripId);
      setDeletingId(null);
    }
  };

  return (
    <main
      className="min-h-screen bg-black text-white relative overflow-hidden"
      style={{ fontFamily: "'VT323', 'Courier New', monospace" }}
    >
      {/* VHS Scan Lines */}
      <div
        className="fixed inset-0 pointer-events-none z-50 opacity-15"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.4) 2px, rgba(0,0,0,0.4) 4px)',
        }}
      />

      {/* VHS Noise */}
      <div
        className="fixed inset-0 pointer-events-none z-40 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Header - VHS Style */}
      <header className="relative pt-8 pb-6 px-4">
        <div className="max-w-lg mx-auto">
          {/* REC indicator */}
          <div className="flex items-center gap-2 mb-6">
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-red-600"
            />
            <span className="text-red-500 text-sm tracking-wider">● REC</span>
            <span className="text-white/30 text-sm ml-auto">
              {new Date().toLocaleDateString('ja-JP').replace(/\//g, '.')}
            </span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="border-4 border-white/40 p-6 bg-black/50">
              <h1 className="text-4xl md:text-5xl tracking-[0.2em] mb-2">AUTO</h1>
              <h1 className="text-4xl md:text-5xl tracking-[0.2em] text-amber-400">MEMORIES</h1>
              <p className="text-white/50 text-lg mt-4 tracking-widest">旅の記録装置</p>
            </div>
          </motion.div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pb-12 space-y-8">
        {/* Create Button - VHS Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link href="/create">
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="relative group"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              <div className="border-4 border-amber-400/80 p-6 bg-amber-400/5 hover:bg-amber-400/10 active:bg-amber-400/20 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">▶</div>
                  <div>
                    <h2 className="text-2xl tracking-widest text-amber-400">新規記録</h2>
                    <p className="text-white/50 text-sm tracking-wider">NEW RECORDING</p>
                  </div>
                  <div className="ml-auto text-2xl text-white/30 group-hover:text-white transition-colors">→</div>
                </div>
              </div>
            </motion.div>
          </Link>
        </motion.div>

        {/* Trips Section - VHS Tape Style */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-white/40 text-sm tracking-widest">LIBRARY</span>
            <div className="flex-1 h-px bg-white/20" />
            {trips.length > 0 && (
              <span className="text-white/30 text-sm">{trips.length} TAPES</span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 border-2 border-white/10 animate-pulse" />
              ))}
            </div>
          ) : trips.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 border-2 border-dashed border-white/20"
            >
              <div className="text-4xl mb-4">📼</div>
              <p className="text-white/40 text-lg tracking-wider">NO TAPES</p>
              <p className="text-white/25 text-sm mt-2">記録がありません</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {trips.map((trip, index) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: deletingId === trip.id ? 0.5 : 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/play/${trip.id}`}>
                      <motion.div
                        whileTap={{ scale: 0.98 }}
                        className="group relative border-2 border-white/20 hover:border-white/40 active:bg-white/5 transition-all"
                        style={{ WebkitTapHighlightColor: 'transparent' }}
                      >
                        {/* Tape label */}
                        <div className="p-4 flex items-center gap-4">
                          <div className="text-3xl">
                            {trip.achievements.length > 0
                              ? ACHIEVEMENT_DEFINITIONS[trip.achievements[0].type].icon
                              : '📼'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg tracking-wider truncate">{trip.name}</h3>
                            <p className="text-white/40 text-sm tracking-wider">
                              {trip.totalPhotos} FRAMES • {trip.totalDistance}KM
                              {trip.achievements.length > 0 && ` • 🏆${trip.achievements.length}`}
                            </p>
                          </div>
                          <div className="text-2xl text-white/20 group-hover:text-amber-400 transition-colors">▶</div>
                        </div>

                        {/* Date label */}
                        <div className="absolute -top-2 -right-2 bg-amber-400 text-black px-2 py-0.5 text-xs">
                          {trip.startDate && formatDate(trip.startDate).slice(5)}
                        </div>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, trip.id)}
                          className="absolute -bottom-2 -left-2 bg-red-600 text-white px-2 py-0.5 text-xs opacity-0 group-hover:opacity-100 hover:bg-red-500 transition-all"
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                        >
                          DEL
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
      <footer className="py-8 text-center border-t border-white/10">
        <p className="text-white/20 text-sm tracking-[0.3em]">
          AUTO MEMORIES SYSTEM V1.0
        </p>
      </footer>

      {/* VHS Font */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=VT323&display=swap');
      `}</style>
    </main>
  );
}
