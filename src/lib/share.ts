import type { Trip } from '@/types';
import { ACHIEVEMENT_DEFINITIONS } from '@/types';

// Generate OGP-style share image using Canvas
export async function generateShareImage(trip: Trip): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // OGP recommended size
    canvas.width = 1200;
    canvas.height = 630;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#16213e');
    gradient.addColorStop(1, '#0f0f23');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative circles
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = '#8B5CF6';
    ctx.beginPath();
    ctx.arc(200, 100, 200, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#EC4899';
    ctx.beginPath();
    ctx.arc(1000, 530, 250, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px "Noto Sans JP", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(trip.name, canvas.width / 2, 200);

    // Date
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '32px "Noto Sans JP", sans-serif';
    const dateStr = trip.startDate
        ? trip.startDate.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
        : '';
    ctx.fillText(dateStr, canvas.width / 2, 260);

    // Stats
    const statsY = 350;
    const statsSpacing = 300;
    const statsStartX = (canvas.width - statsSpacing * 2) / 2;

    // Photos
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px "Noto Sans JP", sans-serif';
    ctx.fillText(trip.totalPhotos.toString(), statsStartX, statsY);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '24px "Noto Sans JP", sans-serif';
    ctx.fillText('写真', statsStartX, statsY + 40);

    // Distance
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px "Noto Sans JP", sans-serif';
    ctx.fillText(`${trip.totalDistance}km`, statsStartX + statsSpacing, statsY);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '24px "Noto Sans JP", sans-serif';
    ctx.fillText('移動距離', statsStartX + statsSpacing, statsY + 40);

    // Achievements
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px "Noto Sans JP", sans-serif';
    ctx.fillText(trip.achievements.length.toString(), statsStartX + statsSpacing * 2, statsY);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '24px "Noto Sans JP", sans-serif';
    ctx.fillText('実績', statsStartX + statsSpacing * 2, statsY + 40);

    // Achievement icons (up to 6)
    const achievementsToShow = trip.achievements.slice(0, 6);
    const iconSize = 50;
    const iconSpacing = 70;
    const iconsStartX = (canvas.width - (achievementsToShow.length - 1) * iconSpacing) / 2;

    ctx.font = '40px serif';
    ctx.textAlign = 'center';
    achievementsToShow.forEach((achievement, i) => {
        const def = ACHIEVEMENT_DEFINITIONS[achievement.type];
        ctx.fillText(def.icon, iconsStartX + i * iconSpacing, 480);
    });

    // Branding
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '24px "Noto Sans JP", sans-serif';
    ctx.fillText('Auto Memories', canvas.width / 2, 580);

    // Convert to blob
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to generate image'));
        }, 'image/png');
    });
}

// Share trip using Web Share API or fallback
export async function shareTrip(trip: Trip, imageBlob?: Blob): Promise<'shared' | 'copied' | 'failed'> {
    const shareText = `${trip.name} - Auto Memoriesで作成した旅の思い出\n📸 ${trip.totalPhotos}枚の写真\n🗺️ ${trip.totalDistance}km\n🏆 ${trip.achievements.length}個の実績`;

    // Try Web Share API
    if (navigator.share) {
        try {
            const shareData: ShareData = {
                title: trip.name,
                text: shareText,
            };

            // Include image if available and supported
            if (imageBlob && navigator.canShare) {
                const file = new File([imageBlob], 'memory.png', { type: 'image/png' });
                if (navigator.canShare({ files: [file] })) {
                    shareData.files = [file];
                }
            }

            await navigator.share(shareData);
            return 'shared';
        } catch (err) {
            if ((err as Error).name === 'AbortError') {
                return 'failed'; // User cancelled
            }
            // Fall through to clipboard
        }
    }

    // Fallback to clipboard
    try {
        await navigator.clipboard.writeText(shareText);
        return 'copied';
    } catch {
        return 'failed';
    }
}

// Download share image
export async function downloadShareImage(trip: Trip): Promise<void> {
    const blob = await generateShareImage(trip);
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${trip.name.replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
