import { MiniGame } from '../core/MiniGame.js';

export class Capture extends MiniGame {
    constructor(canvas, ctx) {
        super(canvas, ctx);
        // Assets
        this.bg = new Image();
        this.bg.src = 'Images/Capture/pré.png';

        this.ufoImg = new Image();
        this.ufoImg.src = 'Images/Capture/soucoupe.png';

        this.cowImg = new Image();
        this.cowImg.src = 'Images/Capture/vache_ufo.png';

        this.rayImg = new Image();
        this.rayImg.src = 'Images/Capture/ray.png';

        this.cowX = -200;
        this.cowY = 400;
        this.cowSpeed = 800; // Reverted to original speed

        this.captureZone = { x: 300, y: 400, w: 200, h: 100 };

        this.captured = false;
        this.hasLaunched = false;
        this.hasAttempted = false; // Only one shot allowed

        this.handleInput = this.handleInput.bind(this);
    }

    start() {
        super.start();
        console.log("Capture Start V2");

        this.cowY = 400;
        this.captured = false;
        this.hasLaunched = false;
        this.hasAttempted = false;

        setTimeout(() => {
            this.hasLaunched = true;
        }, 200 + Math.random() * 1000);

        window.addEventListener('pointerdown', this.handleInput);
        window.addEventListener('keydown', this.handleInput);

        this.playSound('Son/SFX/UFO/ufo.mp3', true);
    }

    handleInput() {
        if (!this.isActive || this.captured || this.hasAttempted) return;

        this.hasAttempted = true; // Mark that the player has used their one attempt

        const cowCenter = this.cowX + 75;
        if (cowCenter > 310 && cowCenter < 490) {
            this.captured = true;
            this.playSound('Son/SFX/UFO/ray.mp3');
            // We DON'T call win() or triggerResultVoice(true) here anymore
            // to follow the "wait for timer" rule. 
            // BUT we mark it won internally.
            this.win();
        } else {
            console.log("Capture: Missed! Cow center at", cowCenter);
            this.isWon = false;
        }
    }

    update(dt) {
        if (!this.isActive) return;
        super.update(dt);

        if (this.hasLaunched && !this.captured) {
            this.cowX += this.cowSpeed * dt;
            if (this.cowX > this.canvas.width + 200) {
                // Cow is gone, wait for timer to end normally via super.update
            }
        }

        if (this.captured) {
            // Cow stops moving horizontally exactly centered under beam (approx 325-150/2)
            // The beam is at 400. Cow width is 150. Centered at 400 means cowX = 325.
            this.cowX = 325;
            if (this.cowY > 40) {
                this.cowY -= 600 * dt;
            }
            this.cowRotation = (this.cowRotation || 0) + 15 * dt;
            this.cowScale = Math.max(0, (this.cowScale === undefined ? 1 : this.cowScale) - 1.4 * dt);
        }
    }

    draw() {
        if (!this.isActive) return;

        if (this.bg.complete) {
            this.ctx.drawImage(this.bg, 0, 0, this.canvas.width, this.canvas.height);
        }

        // Beam
        if (this.rayImg.complete) {
            this.ctx.save();
            this.ctx.translate(400, 320);
            this.ctx.scale(-1.5, 1.2); // Enlarge and flip horizontal
            this.ctx.drawImage(this.rayImg, -80, -200, 160, 400);
            this.ctx.restore();
        } else {
            this.ctx.fillStyle = "rgba(0, 255, 0, 0.3)";
            this.ctx.fillRect(320, 120, 160, 400);
        }

        // UFO
        if (this.ufoImg.complete) {
            this.ctx.drawImage(this.ufoImg, 300, 50, 200, 100);
        }

        // Cow
        if (this.cowImg.complete) {
            this.ctx.save();
            const cx = this.cowX + 75;
            const cy = this.cowY + 60;
            this.ctx.translate(cx, cy);
            if (this.captured) {
                this.ctx.rotate(this.cowRotation);
                this.ctx.scale(this.cowScale, this.cowScale);
            }
            this.ctx.drawImage(this.cowImg, -75, -60, 150, 120);
            this.ctx.restore();
        }

        super.draw();
    }

    cleanup() {
        window.removeEventListener('pointerdown', this.handleInput);
        window.removeEventListener('keydown', this.handleInput);
    }

    getInstruction() {
        return "CAPTURE !";
    }

    // Overriding update to ensure victory trigger happens at the very end
    update(dt) {
        if (!this.isActive) return;
        
        // Manual countdown
        const scaledDt = dt * this.speedMultiplier;
        this.timeLeft -= scaledDt;
        this.bombTimer.update(scaledDt);

        // Core logic
        this.internalUpdate(dt);

        if (this.timeLeft <= 0) {
            this.triggerResultVoice(this.isWon);
            this.endGame();
        }
    }

    internalUpdate(dt) {
        // This is the original update logic without the timer endGame call
        if (this.hasLaunched && !this.captured) {
            this.cowX += this.cowSpeed * dt;
        }

        if (this.captured) {
            this.cowX = 325;
            if (this.cowY > 40) {
                this.cowY -= 600 * dt;
            }
            this.cowRotation = (this.cowRotation || 0) + 15 * dt;
            this.cowScale = Math.max(0, (this.cowScale === undefined ? 1 : this.cowScale) - 1.4 * dt);
        }
    }
}
