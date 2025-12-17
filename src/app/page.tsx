'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MapPin, Sparkles } from 'lucide-react';
import { useTrips } from '@/hooks/useTrips';
import TripCard from '@/components/TripCard';
import { deleteTrip } from '@/lib/db';
import { t } from '@/lib/i18n';

export default function HomePage() {
  const { trips, isLoading } = useTrips();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (tripId: string) => {
    if (confirm(t('trip.deleteConfirm'))) {
      setDeletingId(tripId);
      await deleteTrip(tripId);
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen pb-24">
      {/* Header */}
      <header className="p-6 pt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-purple-400" />
            <h1 className="text-3xl font-bold gradient-text">{t('app.name')}</h1>
          </div>
          <p className="text-white/60">{t('app.tagline')}</p>
        </motion.div>
      </header>

      {/* Content */}
      <div className="px-6 max-w-2xl mx-auto">
        {/* Create new trip button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Link href="/create">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden rounded-2xl p-6 cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.3))',
              }}
            >
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
                  <Plus className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">
                    {t('home.createNew')}
                  </h2>
                  <p className="text-white/70 text-sm">
                    {t('home.createNewDesc')}
                  </p>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-500/20 rounded-full blur-2xl" />
            </motion.div>
          </Link>
        </motion.div>

        {/* Past trips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-white/50" />
            <h2 className="text-lg font-semibold text-white">{t('home.pastMemories')}</h2>
            {trips.length > 0 && (
              <span className="ml-auto text-sm text-white/50">
                {t('home.tripCount', { count: trips.length })}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : trips.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 px-6 rounded-2xl bg-white/5 border border-white/10"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-white/30" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">{t('home.noTrips')}</h3>
              <p className="text-white/50 text-sm max-w-xs mx-auto">{t('home.noTripsDesc')}</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {trips.map((trip, index) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.1 }}
                    style={{ opacity: deletingId === trip.id ? 0.5 : 1 }}
                  >
                    <TripCard
                      trip={trip}
                      onClick={() => window.location.href = `/play/${trip.id}`}
                      onDelete={() => handleDelete(trip.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* Recording tip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent"
      >
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-white/40 text-sm">{t('app.recordingTip')}</p>
        </div>
      </motion.div>
    </main>
  );
}
