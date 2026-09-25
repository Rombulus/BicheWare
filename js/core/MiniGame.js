import { BombTimer } from './BombTimer.js';

export class MiniGame {
    constructor(canvas, context) {
        this.canvas = canvas;
        this.ctx = context;
        this.isActive = false;
        this.timeLeft = 0;
        this.isWon = false;
        this.speedMultiplier = 1.0; // Set by GameManager before start()

        // Audio Tracking
        this.activeSounds = [];

        // Bomb Timer
        this.bombTimer = new BombTimer();
    }

    /** Convert a pointer event into the game's fixed 800x600 coordinate space. */
    getCanvasPoint(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (event.clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }

    capturePointer(event) {
        if (event.pointerId !== undefined && this.canvas.setPointerCapture) {
            this.canvas.setPointerCapture(event.pointerId);
        }
    }

    releasePointer(event) {
        if (event.pointerId !== undefined && this.canvas.releasePointerCapture) {
            try {
                this.canvas.releasePointerCapture(event.pointerId);
            } catch (error) {
                // Safari may already have released the pointer.
            }
        }
    }

    /**
     * Called when the game starts.
     */
    start() {
        this.isActive = true;
        this.isWon = false;
        this.timeLeft = 5.0 / this.speedMultiplier; // Faster at higher speeds
        console.log("MiniGame Started, speed:", this.speedMultiplier);

        // Start visual timer
        this.bombTimer.StartTimer(this.timeLeft);
    }

    /** Load and play sounds through the page's unlocked Web Audio context. */
    playSound(src, loop = false) {
        const context = window.gameAudioContext;
        if (!context || typeof fetch !== 'function') {
            const audio = new Audio(src);
            audio.loop = loop;
            audio.play().catch(error => console.warn('Audio play failed:', src, error));
            this.activeSounds.push(audio);
            return audio;
        }

        const sound = {
            source: null,
            buffer: null,
            loop,
            paused: false,
            stopped: false,
            offset: 0,
            startedAt: 0
        };

        const beginPlayback = () => {
            if (sound.stopped || sound.paused || !sound.buffer || sound.source) return;
            if (context.state !== 'running') {
                context.resume().then(beginPlayback).catch(error => {
                    console.warn('Audio context resume failed:', error);
                });
                return;
            }

            const source = context.createBufferSource();
            source.buffer = sound.buffer;
            source.loop = sound.loop;
            source.connect(context.destination);
            sound.startedAt = context.currentTime;
            sound.source = source;
            source.onended = () => {
                if (sound.source !== source) return;
                sound.source = null;
                if (!sound.loop) sound.stopped = true;
            };

            const duration = sound.buffer.duration;
            const offset = sound.loop && duration > 0
                ? sound.offset % duration
                : sound.offset;
            if (!sound.loop && offset >= duration) {
                sound.stopped = true;
                sound.source = null;
                return;
            }
            source.start(0, offset);
        };

        const stopSource = () => {
            if (!sound.source) return;
            const source = sound.source;
            sound.source = null;
            source.onended = null;
            try {
                source.stop();
            } catch (error) {
                // The source may have ended between the state check and stop().
            }
        };

        sound.pause = () => {
            if (sound.stopped || sound.paused) return;
            if (sound.source) {
                const elapsed = Math.max(0, context.currentTime - sound.startedAt);
                const duration = sound.buffer?.duration || 0;
                sound.offset += elapsed;
                if (sound.loop && duration > 0) sound.offset %= duration;
                else if (duration > 0) sound.offset = Math.min(sound.offset, duration);
                stopSource();
            }
            sound.paused = true;
        };

        sound.stop = () => {
            sound.stopped = true;
            sound.paused = false;
            sound.offset = 0;
            stopSource();
        };

        this.activeSounds.push(sound);

        const cache = window.gameAudioBufferCache || (window.gameAudioBufferCache = new Map());
        const audioUrl = new URL(src, document.baseURI).href;
        let bufferPromise = cache.get(audioUrl);
        if (!bufferPromise) {
            bufferPromise = fetch(audioUrl)
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP ${response.status} loading ${audioUrl}`);
                    return response.arrayBuffer();
                })
                .then(data => context.decodeAudioData(data));
            cache.set(audioUrl, bufferPromise);
            bufferPromise.catch(() => cache.delete(audioUrl));
        }

        bufferPromise.then(buffer => {
            sound.buffer = buffer;
            beginPlayback();
        }).catch(error => {
            sound.stopped = true;
            console.warn('Audio load failed:', audioUrl, error);
        });

        return sound;
    }

    /** Stop every sound started by this mini-game. */
    stopAllSounds() {
        this.activeSounds.forEach(sound => {
            if (typeof sound.stop === 'function') {
                sound.stop();
                return;
            }
            sound.pause();
            sound.src = '';
            sound.load();
        });
        this.activeSounds = [];
    }
    update(dt) {
        if (!this.isActive) return;

        const scaledDt = dt * this.speedMultiplier;
        this.timeLeft -= scaledDt;
        this.bombTimer.update(scaledDt);

        if (this.timeLeft <= 0) {
            this.endGame();
        }
    }

    draw() {
        if (!this.isActive) return;
        // The bomb timer is now handled by DOM elements
    }

    endGame() {
        this.isActive = false;
        console.log(`Game Over. Won: ${this.isWon}`);
        this.stopAllSounds();
        this.bombTimer.StopTimer();

        if (this.isWon) {
            this.bombTimer.hide();
        } else {
            // Keep timer visible for explosion animation
            setTimeout(() => {
                if (!this.isActive) this.bombTimer.hide();
            }, 600);
        }

        if (this.onGameEnd) {
            this.onGameEnd(this.isWon);
        }
    }

    win() {
        this.isWon = true;
    }

    /**
     * Show an instruction on screen.
     */
    showInstruction(text) {
        if (this.onShowInstruction) {
            this.onShowInstruction(text);
        }
    }

    triggerResultVoice(isWon) {
        if (this.onResultVoice) {
            this.onResultVoice(isWon);
        } else if (window.gameManager) {
            window.gameManager.playGlobalVoice(isWon);
        }
    }

    getInstruction() {
        return "JOUTE !"; // Default instruction
    }

    cleanup() {
        this.stopAllSounds();
        this.bombTimer.hide();
    }
}
