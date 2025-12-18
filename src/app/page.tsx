'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Play, Trash2, Loader2 } from 'lucide-react';
import { useTrips } from '@/hooks/useTrips';
import { deleteTrip } from '@/lib/db';
import { ACHIEVEMENT_DEFINITIONS } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const { trips, isLoading } = useTrips();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (tripId: string) => {
    if (confirm('この記録を削除しますか？')) {
      setDeletingId(tripId);
      try {
        await deleteTrip(tripId);
        // useLiveQuery will auto-refresh
      } catch (err) {
        console.error('Delete failed:', err);
        alert('削除に失敗しました');
      }
      setDeletingId(null);
    }
  };

  const handlePlay = (tripId: string) => {
    router.push(`/play/${tripId}`);
  };

  return (
    <main style={{
      minHeight: '100dvh',
      background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1025 50%, #0f0a1a 100%)',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      {/* Background */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.15) 0%, transparent 50%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backgroundColor: 'rgba(10,10,10,0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '20px',
        paddingTop: 'max(20px, env(safe-area-inset-top))',
      }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold' }}>Auto Memories</h1>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>写真から映画を作る</p>
      </header>

      <div style={{ padding: '20px', paddingBottom: '100px' }}>
        {/* Create Button */}
        <Link href="/create" style={{ textDecoration: 'none' }}>
          <motion.div
            whileTap={{ scale: 0.98 }}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              borderRadius: '20px',
              padding: '20px',
              marginBottom: '28px',
              boxShadow: '0 8px 32px rgba(139,92,246,0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Plus size={28} color="white" />
              </div>
              <div>
                <p style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>新しい旅の記録</p>
                <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>写真をアップロード</p>
              </div>
            </div>
          </motion.div>
        </Link>

        {/* Trips List */}
        <div>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', marginBottom: '12px', fontWeight: '500' }}>
            過去の記録
          </p>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Loader2 size={32} color="#8b5cf6" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : trips.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 20px',
              borderRadius: '20px',
              border: '2px dashed rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.02)',
            }}>
              <p style={{ fontSize: '40px', marginBottom: '12px' }}>📷</p>
              <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)' }}>まだ記録がありません</p>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>上のボタンから作成</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <AnimatePresence>
                {trips.map((trip) => (
                  <motion.div
                    key={trip.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: deletingId === trip.id ? 0.5 : 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      borderRadius: '16px',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                    }}>
                      {/* Icon */}
                      <div
                        onClick={() => handlePlay(trip.id)}
                        style={{
                          width: '52px',
                          height: '52px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(236,72,153,0.3))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px',
                          flexShrink: 0,
                          cursor: 'pointer',
                        }}
                      >
                        {trip.achievements?.[0]
                          ? ACHIEVEMENT_DEFINITIONS[trip.achievements[0].type]?.icon || '🎬'
                          : '🎬'}
                      </div>

                      {/* Info - clickable */}
                      <div
                        onClick={() => handlePlay(trip.id)}
                        style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                      >
                        <p style={{
                          fontSize: '18px',
                          fontWeight: '600',
                          color: 'white',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {trip.name}
                        </p>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                          {trip.totalPhotos}枚 • {trip.totalDistance}km
                        </p>
                      </div>

                      {/* Play button */}
                      <button
                        onClick={() => handlePlay(trip.id)}
                        style={{
                          padding: '10px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(139,92,246,0.2)',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <Play size={20} color="#a78bfa" />
                      </button>

                      {/* Delete button - ALWAYS VISIBLE */}
                      <button
                        onClick={() => handleDelete(trip.id)}
                        disabled={deletingId === trip.id}
                        style={{
                          padding: '10px',
                          borderRadius: '10px',
                          backgroundColor: 'rgba(239,68,68,0.2)',
                          border: 'none',
                          cursor: deletingId === trip.id ? 'wait' : 'pointer',
                        }}
                      >
                        {deletingId === trip.id ? (
                          <Loader2 size={20} color="#f87171" style={{ animation: 'spin 1s linear infinite' }} />
                        ) : (
                          <Trash2 size={20} color="#f87171" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}
