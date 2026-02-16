import { BombTimer } from './BombTimer.js';

export class MiniGame {
    constructor(canvas, context) {
        this.canvas = canvas;
        this.ctx = context;
        this.isActive = false;
        this.timeLeft = 0;
        this.isWon = false;

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
        this.timeLeft = 5.0; // Default 5 seconds per game
        console.log("MiniGame Started");

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
        });
        this.activeSounds = [];
    }

    update(dt) {
        if (!this.isActive) return;

        this.timeLeft -= dt;
        this.bombTimer.update(dt);

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

        if (this.onGameEnd) {
            this.onGameEnd(this.isWon);
        }
    }

    win() {
        this.isWon = true;
    }

    cleanup() {
        this.stopAllSounds();
        this.bombTimer.hide();
    }
}
