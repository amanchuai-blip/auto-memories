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
    <main style={{
      minHeight: '100dvh',
      backgroundColor: 'black',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backgroundColor: 'rgba(0,0,0,0.9)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '20px',
        paddingTop: 'max(20px, env(safe-area-inset-top))',
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>Auto Memories</h1>
        <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>写真から映画を作る</p>
      </header>

      <div style={{ padding: '20px', paddingBottom: '100px' }}>
        {/* Create Button */}
        <Link href="/create" style={{ textDecoration: 'none' }}>
          <motion.div
            whileTap={{ scale: 0.98 }}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              borderRadius: '20px',
              padding: '24px',
              marginBottom: '32px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Plus size={32} color="white" />
              </div>
              <div>
                <p style={{ fontSize: '22px', fontWeight: 'bold', color: 'white' }}>新しい旅の記録</p>
                <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>写真をアップロード</p>
              </div>
            </div>
          </motion.div>
        </Link>

        {/* Trips */}
        <div>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)', marginBottom: '16px', fontWeight: '500' }}>過去の記録</p>

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{ height: '100px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.05)' }} />
              ))}
            </div>
          ) : trips.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              borderRadius: '20px',
              border: '2px dashed rgba(255,255,255,0.1)',
            }}>
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>📷</p>
              <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.5)' }}>まだ記録がありません</p>
              <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>上のボタンから作成</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <AnimatePresence>
                {trips.map((trip, i) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: deletingId === trip.id ? 0.5 : 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link href={`/play/${trip.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        position: 'relative',
                        borderRadius: '20px',
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        padding: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '20px',
                      }}>
                        {/* Icon */}
                        <div style={{
                          width: '64px',
                          height: '64px',
                          borderRadius: '16px',
                          background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.2))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '28px',
                          flexShrink: 0,
                        }}>
                          {trip.achievements[0]
                            ? ACHIEVEMENT_DEFINITIONS[trip.achievements[0].type].icon
                            : '🎬'}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '20px', fontWeight: '600', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.name}</p>
                          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                            {trip.totalPhotos}枚 • {trip.totalDistance}km
                            {trip.achievements.length > 0 && ` • 🏆${trip.achievements.length}`}
                          </p>
                        </div>

                        {/* Play */}
                        <Play size={24} color="rgba(255,255,255,0.4)" />

                        {/* Delete */}
                        <button
                          onClick={(e) => handleDelete(e, trip.id)}
                          style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            padding: '10px',
                            borderRadius: '50%',
                            backgroundColor: '#ef4444',
                            border: 'none',
                            opacity: 0,
                            cursor: 'pointer',
                          }}
                          className="delete-btn"
                        >
                          <Trash2 size={16} color="white" />
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

      <style jsx global>{`
        .delete-btn:active, .delete-btn:hover {
          opacity: 1 !important;
        }
      `}</style>
    </main>
  );
}
