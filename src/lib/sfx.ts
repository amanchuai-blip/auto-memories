// Sound effects manager for Auto Memories

type SoundEffect = 'achievement' | 'photo' | 'complete' | 'click' | 'swoosh';

class SoundEffectsManager {
    private audioContext: AudioContext | null = null;
    private sounds: Map<SoundEffect, AudioBuffer> = new Map();
    private enabled = true;
    private volume = 0.5;

    async initialize(): Promise<void> {
        if (this.audioContext) return;
        this.audioContext = new AudioContext();

        // Load all sound effects
        await Promise.all([
            this.loadSound('achievement', '/audio/sfx-achievement.mp3'),
            this.loadSound('photo', '/audio/sfx-photo.mp3'),
            this.loadSound('complete', '/audio/sfx-complete.mp3'),
            this.loadSound('click', '/audio/sfx-click.mp3'),
            this.loadSound('swoosh', '/audio/sfx-swoosh.mp3'),
        ]).catch(() => {
            // Sounds are optional, continue without them
            console.warn('Some sound effects could not be loaded');
        });
    }

    private async loadSound(name: SoundEffect, url: string): Promise<void> {
        if (!this.audioContext) return;

        try {
            const response = await fetch(url);
            if (!response.ok) return;
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.sounds.set(name, audioBuffer);
        } catch {
            // Sound not available, that's ok
        }
    }

    play(name: SoundEffect): void {
        if (!this.enabled || !this.audioContext) return;

        const buffer = this.sounds.get(name);
        if (!buffer) return;

        // Resume AudioContext if suspended (iOS Safari)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = buffer;
        gainNode.gain.value = this.volume;

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        source.start(0);
    }

    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    setVolume(volume: number): void {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    isEnabled(): boolean {
        return this.enabled;
    }
}

// Singleton instance
let sfxInstance: SoundEffectsManager | null = null;

export function getSfx(): SoundEffectsManager {
    if (!sfxInstance) {
        sfxInstance = new SoundEffectsManager();
    }
    return sfxInstance;
}

// Convenience functions
export async function initSfx(): Promise<void> {
    await getSfx().initialize();
}

export function playSfx(name: SoundEffect): void {
    getSfx().play(name);
}

export function setSfxEnabled(enabled: boolean): void {
    getSfx().setEnabled(enabled);
}

export function setSfxVolume(volume: number): void {
    getSfx().setVolume(volume);
}
