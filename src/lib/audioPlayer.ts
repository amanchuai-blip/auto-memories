// Web Audio API wrapper for background music
class AudioPlayer {
    private audioContext: AudioContext | null = null;
    private gainNode: GainNode | null = null;
    private sourceNode: AudioBufferSourceNode | null = null;
    private audioBuffer: AudioBuffer | null = null;
    private isPlaying = false;
    private volume = 0.5;

    async initialize(): Promise<void> {
        if (this.audioContext) return;

        this.audioContext = new AudioContext();
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = this.volume;
        this.gainNode.connect(this.audioContext.destination);
    }

    async loadAudio(url: string): Promise<void> {
        if (!this.audioContext) {
            await this.initialize();
        }

        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            this.audioBuffer = await this.audioContext!.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error('Failed to load audio:', error);
            throw error;
        }
    }

    play(): void {
        if (!this.audioContext || !this.audioBuffer || !this.gainNode) {
            console.warn('Audio not initialized or loaded');
            return;
        }

        if (this.isPlaying) {
            this.stop();
        }

        // Resume AudioContext if suspended (iOS Safari requirement)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        this.sourceNode = this.audioContext.createBufferSource();
        this.sourceNode.buffer = this.audioBuffer;
        this.sourceNode.loop = true;
        this.sourceNode.connect(this.gainNode);
        this.sourceNode.start(0);
        this.isPlaying = true;
    }

    stop(): void {
        if (this.sourceNode) {
            try {
                this.sourceNode.stop();
                this.sourceNode.disconnect();
            } catch {
                // Ignore errors when stopping
            }
            this.sourceNode = null;
        }
        this.isPlaying = false;
    }

    setVolume(value: number): void {
        this.volume = Math.max(0, Math.min(1, value));
        if (this.gainNode) {
            this.gainNode.gain.value = this.volume;
        }
    }

    fadeOut(durationMs: number = 2000): Promise<void> {
        return new Promise((resolve) => {
            if (!this.gainNode || !this.isPlaying) {
                resolve();
                return;
            }

            const startVolume = this.gainNode.gain.value;
            const startTime = performance.now();

            const fade = () => {
                const elapsed = performance.now() - startTime;
                const progress = Math.min(elapsed / durationMs, 1);

                if (this.gainNode) {
                    this.gainNode.gain.value = startVolume * (1 - progress);
                }

                if (progress < 1) {
                    requestAnimationFrame(fade);
                } else {
                    this.stop();
                    if (this.gainNode) {
                        this.gainNode.gain.value = this.volume;
                    }
                    resolve();
                }
            };

            requestAnimationFrame(fade);
        });
    }

    getIsPlaying(): boolean {
        return this.isPlaying;
    }

    destroy(): void {
        this.stop();
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.gainNode = null;
        this.audioBuffer = null;
    }
}

// Singleton instance
let playerInstance: AudioPlayer | null = null;

export function getAudioPlayer(): AudioPlayer {
    if (!playerInstance) {
        playerInstance = new AudioPlayer();
    }
    return playerInstance;
}

export function destroyAudioPlayer(): void {
    if (playerInstance) {
        playerInstance.destroy();
        playerInstance = null;
    }
}
