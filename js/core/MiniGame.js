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

    /**
     * Helper to play a sound and track it for cleanup.
     */
    playSound(src, loop = false) {
        const audio = new Audio(src);
        audio.loop = loop;
        audio.play().catch(e => console.warn("Audio play failed:", e));
        this.activeSounds.push(audio);
        return audio;
    }

    /**
     * Stop all sounds tracked by this mini-game.
     */
    stopAllSounds() {
        this.activeSounds.forEach(audio => {
            audio.pause();
            audio.src = "";
            audio.load();
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
