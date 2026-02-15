export class MiniGame {
    constructor(canvas, context) {
        this.canvas = canvas;
        this.ctx = context;
        this.isActive = false;
        this.timeLeft = 0;
        this.isWon = false;

        // Audio Tracking
        this.activeSounds = [];

        // Timer Assets
        this.timerImages = {};
        this.loadTimerAssets();
    }

    loadTimerAssets() {
        const frames = ['bombe_1', 'bombe_2', 'bombe_3', 'bombe_4', 'bombe_5', 'boom'];
        frames.forEach(frame => {
            const img = new Image();
            img.src = `Images/Timer/${frame}.png`;
            this.timerImages[frame] = img;
        });
    }

    /**
     * Called when the game starts.
     */
    start() {
        this.isActive = true;
        this.isWon = false;
        this.timeLeft = 5.0; // Default 5 seconds per game
        console.log("MiniGame Started");
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
        if (this.timeLeft <= 0) {
            this.endGame();
        }
    }

    draw() {
        if (!this.isActive) return;

        // Default draw replaced by timer logic
        this.drawTimer();
    }

    drawTimer() {
        if (this.timeLeft > 5) return;

        let frameName = '';
        if (this.timeLeft <= 0) {
            frameName = 'boom';
        } else {
            const seconds = Math.ceil(this.timeLeft); // 5, 4, 3, 2, 1
            frameName = `bombe_${seconds}`;
        }

        const img = this.timerImages[frameName];
        if (img && img.complete) {
            // WarioWare Touched style: Large and stretched at the bottom
            const baseW = 400;
            const baseH = 200;
            // Stretch or center? User said "étirer au max"
            // Let's make it fill a large portion of the bottom center
            const displayW = this.canvas.width * 0.8;
            const displayH = 250;
            this.ctx.drawImage(img, (this.canvas.width - displayW) / 2, this.canvas.height - displayH + 50, displayW, displayH);
        }
    }

    endGame() {
        this.isActive = false;
        console.log(`Game Over. Won: ${this.isWon}`);
        this.stopAllSounds(); // Ensure local sounds stop
        if (this.onGameEnd) {
            this.onGameEnd(this.isWon);
        }
    }

    win() {
        this.isWon = true;
    }

    cleanup() {
        this.stopAllSounds();
    }
}
